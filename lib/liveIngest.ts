import { appendToCollection, readStore, replaceCollection } from "@/lib/storage";
import { fetchTedNotices } from "@/lib/connectors/ted";
import { fetchServiceBundRss } from "@/lib/connectors/serviceBund";

function inferTrade(title: string) {
  const t = (title || "").toLowerCase();
  if (t.includes("reinigung") || t.includes("glas")) return "Reinigung";
  if (t.includes("hausmeister") || t.includes("hauswart")) return "Hausmeister";
  if (t.includes("winterdienst") || t.includes("glätte") || t.includes("schnee")) return "Winterdienst";
  if (t.includes("sicherheit") || t.includes("wach")) return "Sicherheit";
  if (t.includes("grün") || t.includes("baum")) return "Grünpflege";
  return "Sonstiges";
}

function matchSite(trade: string, sites: any[], rules: any[]) {
  const enabledRules = rules.filter((r: any) => r.enabled && r.trade.toLowerCase().includes(trade.toLowerCase()));
  if (!enabledRules.length) return null;
  const rule = enabledRules[0];
  return sites.find((s: any) => s.id === rule.siteId) || null;
}

function aiLikeDecision(hit: any) {
  let score = 0;
  if ((hit.distanceKm || 999) <= 10) score += 30;
  else if ((hit.distanceKm || 999) <= 30) score += 20;

  if ((hit.estimatedValue || 0) >= 500000) score += 25;
  else score += 10;

  if ((hit.durationMonths || 0) >= 24) score += 20;
  else score += 8;

  if (score >= 70) return "prefiltered";
  if (score >= 45) return "manual_review";
  return "observed";
}

export async function runLiveIngest() {
  const db = await readStore();
  const sites = db.sites || [];
  const rules = db.siteTradeRules || [];
  const sourceStats = db.sourceStats || [];
  const existingHits = db.sourceHits || [];

  const now = new Date().toISOString();
  const freshHits: any[] = [];

  // TED
  try {
    const ted = await fetchTedNotices();
    const tedRows = Array.isArray(ted?.notices) ? ted.notices : [];

    for (let i = 0; i < tedRows.length; i++) {
      const row: any = tedRows[i];
      const title = row["notice-title"] || row.title || `TED Notice ${i + 1}`;
      const trade = inferTrade(title);
      const site = matchSite(trade, sites, rules);

      freshHits.push({
        id: `live_ted_${Date.now()}_${i}`,
        sourceId: "src_ted",
        title,
        region: row["place-of-performance"] || "unbekannt",
        postalCode: "",
        trade,
        estimatedValue: Number(row["estimated-value"] || 0),
        durationMonths: 24,
        distanceKm: site ? 15 : 999,
        matchedSiteId: site?.id || "",
        status: aiLikeDecision({
          estimatedValue: Number(row["estimated-value"] || 0),
          distanceKm: site ? 15 : 999,
          durationMonths: 24
        }),
        addedSinceLastFetch: true,
        url: "https://ted.europa.eu/"
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
        lastRunOk: true,
        dataMode: "live"
      };
    }
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

  // service.bund
  try {
    const rss = await fetchServiceBundRss();

    for (let i = 0; i < rss.length; i++) {
      const row = rss[i];
      const trade = inferTrade(row.title);
      const site = matchSite(trade, sites, rules);

      freshHits.push({
        id: `live_sb_${Date.now()}_${i}`,
        sourceId: "src_service_bund",
        title: row.title,
        region: row.description?.slice(0, 80) || "unbekannt",
        postalCode: "",
        trade,
        estimatedValue: 0,
        durationMonths: 12,
        distanceKm: site ? 20 : 999,
        matchedSiteId: site?.id || "",
        status: aiLikeDecision({
          estimatedValue: 0,
          distanceKm: site ? 20 : 999,
          durationMonths: 12
        }),
        addedSinceLastFetch: true,
        url: row.link || "https://service.bund.de/"
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
        lastRunOk: true,
        dataMode: "live"
      };
    }
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

  const finalHits = [...freshHits, ...existingHits].slice(0, 100);

  await replaceCollection("sourceHits", finalHits);
  await replaceCollection("sourceStats", sourceStats);
  await replaceCollection("meta", [
    {
      ...(db.meta || {}),
      lastSuccessfulIngestionAt: now,
      lastSuccessfulIngestionSource: "TED + service.bund",
      dataMode: freshHits.length ? "live" : (db.meta?.dataMode || "demo"),
      dataValidityNote: freshHits.length
        ? "Mindestens ein Teil der Treffer wurde live abgerufen."
        : "Live-Abruf fehlgeschlagen, Fallback aktiv."
    }
  ]);

  return {
    ok: true,
    fetched: freshHits.length
  };
}
