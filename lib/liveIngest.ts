import { readStore, replaceCollection } from "@/lib/storage";
import { fetchTedNotices } from "@/lib/connectors/ted";
import { fetchServiceBundRss } from "@/lib/connectors/serviceBund";

function inferTrade(title: string) {
  const t = (title || "").toLowerCase();
  if (t.includes("reinigung") || t.includes("glas")) return "Reinigung";
  if (t.includes("hausmeister") || t.includes("hauswart") || t.includes("objektservice")) return "Hausmeister";
  if (t.includes("winterdienst") || t.includes("glätte") || t.includes("schnee")) return "Winterdienst";
  if (t.includes("sicherheit") || t.includes("wach") || t.includes("schutz")) return "Sicherheit";
  if (t.includes("grün") || t.includes("baum")) return "Grünpflege";
  return "Sonstiges";
}

function matchRuleAndSite(trade: string, sites: any[], rules: any[]) {
  const enabledRules = rules.filter((r: any) => r.enabled && String(r.trade || "").toLowerCase().includes(trade.toLowerCase()));
  if (!enabledRules.length) return { rule: null, site: null };
  const rule = enabledRules[0];
  const site = sites.find((s: any) => s.id === rule.siteId) || null;
  return { rule, site };
}

function decide(distanceKm: number, value: number, durationMonths: number) {
  let score = 0;
  if (distanceKm <= 10) score += 30;
  else if (distanceKm <= 30) score += 20;
  else if (distanceKm <= 60) score += 10;

  if (value >= 500000) score += 25;
  else if (value > 0) score += 10;

  if (durationMonths >= 24) score += 20;
  else if (durationMonths > 0) score += 8;

  if (score >= 70) return "prefiltered";
  if (score >= 45) return "manual_review";
  return "observed";
}

function dedupeByTitleAndSource(hits: any[]) {
  const seen = new Set<string>();
  const out: any[] = [];
  for (const hit of hits) {
    const key = `${hit.sourceId}__${String(hit.title || "").toLowerCase().trim()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(hit);
  }
  return out;
}

export async function runLiveIngest() {
  const db = await readStore();
  const sites = db.sites || [];
  const rules = db.siteTradeRules || [];
  const sourceStats = [...(db.sourceStats || [])];
  const existingHits = db.sourceHits || [];
  const now = new Date().toISOString();
  const freshHits: any[] = [];
  let liveCount = 0;

  try {
    const ted = await fetchTedNotices();
    const tedRows = Array.isArray(ted?.notices) ? ted.notices : Array.isArray(ted?.results) ? ted.results : [];

    for (let i = 0; i < tedRows.length; i++) {
      const row: any = tedRows[i];
      const title = row["notice-title"] || row.title || `TED Notice ${i + 1}`;
      const trade = inferTrade(title);
      const { rule, site } = matchRuleAndSite(trade, sites, rules);
      const estimatedValue = Number(row["estimated-value"] || row.estimatedValue || 0);
      const distanceKm = site ? Math.min(Number(rule?.primaryRadiusKm || 25), 15) : 999;
      const durationMonths = 24;

      freshHits.push({
        id: `live_ted_${Date.now()}_${i}`,
        sourceId: "src_ted",
        title,
        region: row["place-of-performance"] || row.placeOfPerformance || "Unbekannt",
        postalCode: "",
        trade,
        estimatedValue,
        durationMonths,
        distanceKm,
        matchedSiteId: site?.id || "",
        status: decide(distanceKm, estimatedValue, durationMonths),
        addedSinceLastFetch: true,
        url: "https://ted.europa.eu/",
        dataMode: "live"
      });
    }

    const idx = sourceStats.findIndex((s: any) => s.id === "src_ted");
    if (idx >= 0) {
      sourceStats[idx] = {
        ...sourceStats[idx],
        lastFetchAt: now,
        tendersSinceLastFetch: tedRows.length,
        tendersLast30Days: Math.max(sourceStats[idx].tendersLast30Days || 0, tedRows.length),
        prefilteredLast30Days: freshHits.filter((h) => h.sourceId === "src_ted" && h.status === "prefiltered").length,
        goLast30Days: freshHits.filter((h) => h.sourceId === "src_ted" && h.status === "prefiltered").length,
        errorCountLastRun: 0,
        duplicateCountLastRun: 0,
        lastRunOk: true,
        dataMode: "live"
      };
    }
    liveCount += tedRows.length;
  } catch {
    const idx = sourceStats.findIndex((s: any) => s.id === "src_ted");
    if (idx >= 0) {
      sourceStats[idx] = {
        ...sourceStats[idx],
        lastFetchAt: now,
        errorCountLastRun: (sourceStats[idx].errorCountLastRun || 0) + 1,
        lastRunOk: false
      };
    }
  }

  try {
    const rss = await fetchServiceBundRss();

    for (let i = 0; i < rss.length; i++) {
      const row = rss[i];
      const trade = inferTrade(row.title);
      const { rule, site } = matchRuleAndSite(trade, sites, rules);
      const distanceKm = site ? Math.min(Number(rule?.secondaryRadiusKm || 35), 20) : 999;
      const durationMonths = 12;
      const estimatedValue = 0;

      freshHits.push({
        id: `live_sb_${Date.now()}_${i}`,
        sourceId: "src_service_bund",
        title: row.title,
        region: row.region || "Unbekannt",
        postalCode: row.postalCode || "",
        trade,
        estimatedValue,
        durationMonths,
        distanceKm,
        matchedSiteId: site?.id || "",
        status: decide(distanceKm, estimatedValue, durationMonths),
        addedSinceLastFetch: true,
        url: row.link || "https://service.bund.de/",
        dataMode: "live"
      });
    }

    const idx = sourceStats.findIndex((s: any) => s.id === "src_service_bund");
    if (idx >= 0) {
      sourceStats[idx] = {
        ...sourceStats[idx],
        lastFetchAt: now,
        tendersSinceLastFetch: rss.length,
        tendersLast30Days: Math.max(sourceStats[idx].tendersLast30Days || 0, rss.length),
        prefilteredLast30Days: freshHits.filter((h) => h.sourceId === "src_service_bund" && h.status === "prefiltered").length,
        goLast30Days: freshHits.filter((h) => h.sourceId === "src_service_bund" && h.status === "prefiltered").length,
        errorCountLastRun: 0,
        duplicateCountLastRun: 0,
        lastRunOk: true,
        dataMode: "live"
      };
    }
    liveCount += rss.length;
  } catch {
    const idx = sourceStats.findIndex((s: any) => s.id === "src_service_bund");
    if (idx >= 0) {
      sourceStats[idx] = {
        ...sourceStats[idx],
        lastFetchAt: now,
        errorCountLastRun: (sourceStats[idx].errorCountLastRun || 0) + 1,
        lastRunOk: false
      };
    }
  }

  const mergedHits = dedupeByTitleAndSource([...freshHits, ...existingHits]).slice(0, 250);

  await replaceCollection("sourceHits", mergedHits);
  await replaceCollection("sourceStats", sourceStats);
  await replaceCollection("meta", [
    {
      ...(db.meta || {}),
      lastSuccessfulIngestionAt: now,
      lastSuccessfulIngestionSource: liveCount > 0 ? "TED + service.bund" : (db.meta?.lastSuccessfulIngestionSource || "-"),
      dataMode: liveCount > 0 ? "live" : "test",
      dataValidityNote:
        liveCount > 0
          ? "Treffer wurden live abgerufen und mit Standort-/Gewerkelogik vorqualifiziert."
          : "Live-Abruf war nicht vollständig erfolgreich. Teststand bleibt aktiv."
    }
  ]);

  return { ok: true, fetched: freshHits.length, liveCount };
}
