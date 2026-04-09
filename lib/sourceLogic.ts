export function sourceUsefulnessScore(stat: any) {
  const found = stat?.tendersLast30Days || 0;
  const pre = stat?.prefilteredLast30Days || 0;
  const go = stat?.goLast30Days || 0;
  const errors = stat?.errorCountLastRun || 0;
  const dup = stat?.duplicateCountLastRun || 0;
  return Math.max(0, found + pre * 2 + go * 4 - errors * 5 - dup);
}

export function sourceHealth(stat: any) {
  if (!stat) return "unbekannt";
  if (stat.lastRunOk && (stat.errorCountLastRun || 0) === 0) return "gruen";
  if ((stat.errorCountLastRun || 0) <= 1) return "gelb";
  return "kritisch";
}

export function smokeSummary(db: any) {
  const hits = db?.sourceHits || [];
  return {
    mode: db?.meta?.dataMode || "test",
    totalHits: hits.length,
    newSinceLastFetch: hits.filter((x: any) => x.addedSinceLastFetch).length,
    prefiltered: hits.filter((x: any) => x.status === "prefiltered").length,
    manualReview: hits.filter((x: any) => x.status === "manual_review").length,
    observed: hits.filter((x: any) => x.status === "observed").length,
    bySource: (db?.sourceRegistry || []).map((src: any) => ({
      source: src.name,
      hits: hits.filter((h: any) => h.sourceId === src.id).length
    }))
  };
}

export function aiSmokeForHit(hit: any) {
  let score = 0;
  const reasons: string[] = [];

  if ((hit?.distanceKm || 999) <= 10) {
    score += 30;
    reasons.push("kurze Distanz");
  } else if ((hit?.distanceKm || 999) <= 30) {
    score += 20;
    reasons.push("solide Distanz");
  } else if ((hit?.distanceKm || 999) <= 60) {
    score += 10;
    reasons.push("erweiterter Radius");
  }

  if ((hit?.estimatedValue || 0) >= 500000) {
    score += 25;
    reasons.push("attraktives Volumen");
  } else if ((hit?.estimatedValue || 0) > 0) {
    score += 12;
    reasons.push("mittleres Volumen");
  } else {
    score += 5;
    reasons.push("Volumen unbekannt");
  }

  if ((hit?.durationMonths || 0) >= 24) {
    score += 20;
    reasons.push("längere Laufzeit");
  } else if ((hit?.durationMonths || 0) > 0) {
    score += 8;
    reasons.push("kürzere Laufzeit");
  }

  if (hit?.status === "prefiltered") {
    score += 20;
    reasons.push("vorqualifiziert");
  } else if (hit?.status === "manual_review") {
    score += 10;
    reasons.push("manuelle Prüfung");
  }

  const recommendation = score >= 80 ? "Bid" : score >= 55 ? "Prüfen" : "No-Go";
  const explanation =
    recommendation === "Bid"
      ? "Gute Passung zu Radius, Volumen und aktueller Bearbeitungslogik."
      : recommendation === "Prüfen"
        ? "Relevanter Treffer, sollte aber gegen Kapazität und Leistungsumfang geprüft werden."
        : "Aktuell nicht priorisiert oder operativ zu weit weg.";

  return { recommendation, score, reasons, explanation };
}

export function aggregateHitsByRegionAndTrade(hits: any[]) {
  const map = new Map<string, {
    region: string;
    trade: string;
    count: number;
    volume: number;
    totalDuration: number;
    sources: Set<string>;
    bids: number;
    reviews: number;
  }>();

  for (const hit of hits || []) {
    const region = hit?.region || "Unbekannt";
    const trade = hit?.trade || "Sonstiges";
    const sourceId = hit?.sourceId || "unbekannt";
    const key = `${region}__${trade}`;

    const current = map.get(key) || {
      region,
      trade,
      count: 0,
      volume: 0,
      totalDuration: 0,
      sources: new Set<string>(),
      bids: 0,
      reviews: 0
    };

    current.count += 1;
    current.volume += Number(hit?.estimatedValue || 0);
    current.totalDuration += Number(hit?.durationMonths || 0);
    current.sources.add(sourceId);
    if (hit?.status === "prefiltered") current.bids += 1;
    if (hit?.status === "manual_review") current.reviews += 1;

    map.set(key, current);
  }

  return Array.from(map.values())
    .map((row) => ({
      region: row.region,
      trade: row.trade,
      count: row.count,
      volume: row.volume,
      avgDurationMonths: row.count ? Math.round(row.totalDuration / row.count) : 0,
      sources: row.sources.size,
      bids: row.bids,
      reviews: row.reviews
    }))
    .sort((a, b) => b.volume - a.volume || b.count - a.count);
}

export function aggregateSourceRegionTradePotential(db: any) {
  const hits = db?.sourceHits || [];
  const rules = db?.siteTradeRules || [];
  const sites = db?.sites || [];

  const byTrade = new Map<string, any[]>();
  for (const rule of rules) {
    const key = (rule.trade || "Sonstiges").toLowerCase();
    const arr = byTrade.get(key) || [];
    arr.push(rule);
    byTrade.set(key, arr);
  }

  const map = new Map<string, {
    region: string;
    trade: string;
    sources: Set<string>;
    total: number;
    bid: number;
    review: number;
    nearNextRadius: number;
    activeSites: Set<string>;
  }>();

  for (const hit of hits) {
    const region = hit?.region || "Unbekannt";
    const trade = hit?.trade || "Sonstiges";
    const key = `${region}__${trade}`;
    const item = map.get(key) || {
      region,
      trade,
      sources: new Set<string>(),
      total: 0,
      bid: 0,
      review: 0,
      nearNextRadius: 0,
      activeSites: new Set<string>()
    };

    item.total += 1;
    if (hit?.status === "prefiltered") item.bid += 1;
    if (hit?.status === "manual_review") item.review += 1;
    item.sources.add(hit?.sourceId || "unbekannt");
    if (hit?.matchedSiteId) item.activeSites.add(hit.matchedSiteId);

    const tradeRules = byTrade.get(trade.toLowerCase()) || [];
    for (const rule of tradeRules) {
      const d = Number(hit?.distanceKm || 999);
      const sec = Number(rule.secondaryRadiusKm || 0);
      const ter = Number(rule.tertiaryRadiusKm || sec);
      if (d > sec && d <= ter) {
        item.nearNextRadius += 1;
        break;
      }
    }

    map.set(key, item);
  }

  return Array.from(map.values())
    .map((x) => ({
      region: x.region,
      trade: x.trade,
      sources: x.sources.size,
      total: x.total,
      bid: x.bid,
      review: x.review,
      nearNextRadius: x.nearNextRadius,
      activeSites: x.activeSites.size
    }))
    .sort((a, b) => b.total - a.total || b.bid - a.bid);
}
