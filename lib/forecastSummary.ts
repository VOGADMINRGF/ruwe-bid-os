import { readStore, replaceCollection } from "@/lib/storage";

function n(v: any) {
  const x = Number(v || 0);
  return Number.isFinite(x) ? x : 0;
}

export async function buildForecastSummary() {
  const db = await readStore();
  const opps = Array.isArray(db.opportunities) ? db.opportunities : [];
  const usableHits = (db.sourceHits || []).filter((x: any) => x.operationallyUsable);

  const byRegionTrade = new Map<string, any>();

  for (const hit of usableHits) {
    const key = `${hit.region || "Unbekannt"}__${hit.trade || "Unbekannt"}`;
    const prev = byRegionTrade.get(key) || {
      region: hit.region || "Unbekannt",
      trade: hit.trade || "Unbekannt",
      hitCount: 0,
      value: 0,
      bidCount: 0,
      reviewCount: 0
    };

    prev.hitCount += 1;
    prev.value += n(hit.estimatedValue);
    if (hit.aiRecommendation === "Bid") prev.bidCount += 1;
    if (hit.aiRecommendation === "Prüfen") prev.reviewCount += 1;

    byRegionTrade.set(key, prev);
  }

  const hotspots = [...byRegionTrade.values()]
    .sort((a: any, b: any) => b.value - a.value || b.hitCount - a.hitCount)
    .slice(0, 12);

  const summary = {
    createdAt: new Date().toISOString(),
    hotspots,
    totalOpportunityValue: opps.reduce((s: number, x: any) => s + n(x.estimatedValue), 0),
    totalOpportunities: opps.length
  };

  const dbPrev = await readStore();
  const snaps = Array.isArray(dbPrev.forecastSnapshots) ? dbPrev.forecastSnapshots : [];
  await replaceCollection("forecastSnapshots" as any, [summary, ...snaps].slice(0, 20));

  return summary;
}
