import { readStore } from "@/lib/storage";
import { ensureSourceRegistryDefaults } from "@/lib/sourceControl";
import { ensureSourceCapabilities } from "@/lib/sourceCapabilities";
import { ensureConnectors } from "@/lib/connectors";
import { sourceUsefulnessExplain, sourceHealth } from "@/lib/sourceLogic";

function sameSource(hit: any, sourceId: string) {
  return String(hit?.sourceId || "") === String(sourceId || "");
}

export async function buildQuellensteuerung() {
  await ensureSourceRegistryDefaults();
  await ensureSourceCapabilities();
  await ensureConnectors();

  const db = await readStore();
  const registry = Array.isArray(db.sourceRegistry) ? db.sourceRegistry : [];
  const stats = Array.isArray(db.sourceStats) ? db.sourceStats : [];
  const connectors = Array.isArray(db.connectors) ? db.connectors : [];
  const hits = Array.isArray(db.sourceHits) ? db.sourceHits : [];
  const queryHistory = Array.isArray(db.queryHistory) ? db.queryHistory : [];
  const meta = db.meta || {};

  const rows = registry.map((src: any) => {
    const hitRows = hits.filter((h: any) => sameSource(h, src.id));
    const statRow = stats.find((s: any) => s.id === src.id || s.sourceId === src.id) || {};
    const conn = connectors.find((c: any) => c.id === src.id) || {};
    const latestRun = queryHistory.find((q: any) => q.sourceId === src.id && q.mode === "source_refresh") || null;

    const validLinks = hitRows.filter((h: any) => h.directLinkValid === true).length;
    const invalidLinks = hitRows.filter((h: any) => h.directLinkValid !== true).length;
    const aiEligible = hitRows.filter((h: any) => h.aiEligible === true).length;
    const operational = hitRows.filter((h: any) => h.operationallyUsable === true).length;
    const withVolume = hitRows.filter((h: any) => Number(h.estimatedValue || 0) > 0).length;
    const withDueDate = hitRows.filter((h: any) => !!h.dueDate).length;
    const queryStatus = src.lastQueryStatus || statRow.lastQueryStatus || latestRun?.status || "unbekannt";
    const resultStatus = src.lastResultStatus || latestRun?.status || "idle";
    const use = sourceUsefulnessExplain({
      stat: statRow,
      hits: hitRows,
      queryRuns: queryHistory.filter((q: any) => q.sourceId === src.id).slice(0, 8)
    });

    return {
      id: src.id,
      name: src.name || src.id,
      type: src.type || "portal",
      legalUse: src.legalUse || "mittel",
      dataMode: src.dataMode || "live",
      notes: src.notes || "",
      active: src.active !== false,
      status: src.status || conn.status || "idle",
      health: sourceHealth(statRow, { hits: hitRows }),
      lastRunAt: src.lastRunAt || statRow.lastFetchAt || "-",
      hitsLastRun: Number(src.lastRunCount || 0),
      hitsTotal: hitRows.length,
      validLinks,
      invalidLinks,
      aiEligible,
      operationalHits: operational,
      withVolume,
      withDueDate,
      deepLinkStatus:
        hitRows.length === 0 ? "noch offen" :
        validLinks === 0 ? "nicht belastbar" :
        validLinks < hitRows.length ? "teilweise" : "voll",
      supportsQuerySearch: conn.supportsQuerySearch === true,
      supportsFeed: conn.supportsFeed !== false,
      supportsDeepLink: conn.supportsDeepLink === true,
      supportsManualImport: conn.supportsManualImport !== false,
      lastTestOk: conn.lastTestOk,
      lastTestAt: conn.lastTestAt || null,
      lastTestMessage: conn.lastTestMessage || null,
      score: use.score ?? statRow.score ?? src.score ?? 0,
      scoreBucket: use.bucket,
      scoreReasons: use.reasons || [],
      lastQuery: src.lastQuery || null,
      queryStatus,
      resultStatus,
      resultNote: src.lastResultNote || latestRun?.error || null,
      latestQueryRun: latestRun
    };
  });

  return {
    rows,
    summary: {
      lastRunAllAt: meta.lastRunAllAt || null,
      sourceCount: rows.length,
      totalHits: rows.reduce((s: number, x: any) => s + x.hitsTotal, 0),
      totalValidLinks: rows.reduce((s: number, x: any) => s + x.validLinks, 0),
      totalInvalidLinks: rows.reduce((s: number, x: any) => s + x.invalidLinks, 0),
      totalAiEligible: rows.reduce((s: number, x: any) => s + x.aiEligible, 0)
    }
  };
}
