import { readStore } from "@/lib/storage";

function sameSource(hit: any, sourceId: string) {
  return String(hit?.sourceId || "") === String(sourceId || "");
}

export async function buildQuellensteuerung() {
  const db = await readStore();
  const registry = Array.isArray(db.sourceRegistry) ? db.sourceRegistry : [];
  const stats = Array.isArray(db.sourceStats) ? db.sourceStats : [];
  const connectors = Array.isArray(db.connectors) ? db.connectors : [];
  const hits = Array.isArray(db.sourceHits) ? db.sourceHits : [];
  const meta = db.meta || {};

  const rows = registry.map((src: any) => {
    const hitRows = hits.filter((h: any) => sameSource(h, src.id));
    const statRow = stats.find((s: any) => s.id === src.id || s.sourceId === src.id) || {};
    const conn = connectors.find((c: any) => c.id === src.id) || {};

    const validLinks = hitRows.filter((h: any) => h.directLinkValid === true).length;
    const aiEligible = hitRows.filter((h: any) => h.aiEligible === true).length;
    const operational = hitRows.filter((h: any) => h.operationallyUsable !== false).length;

    return {
      id: src.id,
      name: src.name || src.id,
      status: src.status || conn.status || "idle",
      lastRunAt: src.lastRunAt || "-",
      hitsLastRun: Number(src.lastRunCount || 0),
      hitsTotal: hitRows.length,
      validLinks,
      aiEligible,
      operational,
      deepLinkStatus:
        hitRows.length === 0 ? "noch offen" :
        validLinks === 0 ? "nicht belastbar" :
        validLinks < hitRows.length ? "teilweise" : "voll",
      supportsQuerySearch: conn.supportsQuerySearch === true,
      supportsDeepLink: conn.supportsDeepLink === true,
      lastTestOk: conn.lastTestOk,
      lastTestAt: conn.lastTestAt || null,
      lastTestMessage: conn.lastTestMessage || null,
      score: statRow.score ?? src.score ?? 0
    };
  });

  return {
    rows,
    summary: {
      lastRunAllAt: meta.lastRunAllAt || null,
      sourceCount: rows.length,
      totalHits: rows.reduce((s: number, x: any) => s + x.hitsTotal, 0),
      totalValidLinks: rows.reduce((s: number, x: any) => s + x.validLinks, 0),
      totalAiEligible: rows.reduce((s: number, x: any) => s + x.aiEligible, 0)
    }
  };
}
