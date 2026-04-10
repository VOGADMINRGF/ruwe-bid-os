function n(v: any) {
  const x = Number(v || 0);
  return Number.isFinite(x) ? x : 0;
}

function daysSince(iso: any) {
  if (!iso) return 999;
  const d = new Date(String(iso));
  if (Number.isNaN(d.getTime())) return 999;
  return Math.max(0, Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24)));
}

export function sourceUsefulnessExplain(input: any) {
  const stat = input?.stat || input || {};
  const hits = Array.isArray(input?.hits) ? input.hits : [];
  const runs = Array.isArray(input?.queryRuns) ? input.queryRuns : [];

  const found30 = n(stat?.tendersLast30Days);
  const go30 = n(stat?.goLast30Days);
  const pre30 = n(stat?.prefilteredLast30Days);
  const inserted = n(stat?.tendersSinceLastFetch);
  const usableLast = n(stat?.usableHitsLastRun);
  const invalidLast = n(stat?.invalidLinksLastRun);
  const errors = n(stat?.errorCountLastRun);
  const duplicates = n(stat?.duplicateCountLastRun);

  const hitUsable = hits.filter((x: any) => x?.directLinkValid === true).length;
  const hitInvalid = hits.filter((x: any) => x?.directLinkValid !== true).length;
  const linkBase = hitUsable + hitInvalid > 0 ? hitUsable + hitInvalid : usableLast + invalidLast;
  const linkRatio = linkBase > 0 ? (hitUsable + usableLast) / (linkBase + usableLast + invalidLast) : 0;

  const okRuns = runs.filter((x: any) => x?.status === "done" || x?.status === "ok").length;
  const totalRuns = runs.length;
  const runRatio = totalRuns > 0 ? okRuns / totalRuns : 0;
  const staleDays = daysSince(stat?.lastFetchAt || stat?.lastRunAt);

  let score = 35;
  score += Math.min(20, found30 * 0.6 + inserted * 2);
  score += Math.min(18, go30 * 4 + pre30 * 1.4);
  score += Math.round(linkRatio * 18);
  score += Math.round(runRatio * 10);
  score -= Math.min(20, errors * 12 + duplicates * 1.8 + invalidLast * 0.8);
  if (staleDays <= 1) score += 6;
  else if (staleDays <= 3) score += 3;
  else if (staleDays > 14) score -= 12;
  else if (staleDays > 7) score -= 6;

  score = Math.max(0, Math.min(100, Math.round(score)));

  const reasons: string[] = [];
  if (linkRatio >= 0.7) reasons.push("Hoher Direktlink-Anteil in den Treffern.");
  else if (linkRatio > 0) reasons.push("Direktlink-Qualität ist nur teilweise belastbar.");
  else reasons.push("Direktlink-Qualität ist unzureichend.");

  if (go30 + pre30 > 0) reasons.push("Quelle liefert operativ verwertbare Vorfilter-Signale.");
  else reasons.push("Wenig verwertbare Vorfilter-Signale in den letzten Läufen.");

  if (errors > 0) reasons.push("Fehler im letzten Lauf reduzieren die operative Verlässlichkeit.");
  if (staleDays > 7) reasons.push("Abruf ist veraltet und sollte erneut laufen.");
  if (totalRuns === 0) reasons.push("Noch kein dokumentierter Query-Lauf vorhanden.");

  const bucket = score >= 75 ? "hoch" : score >= 50 ? "mittel" : "niedrig";

  return {
    score,
    bucket,
    reasons: reasons.slice(0, 3),
    metrics: {
      linkRatio,
      runRatio,
      staleDays,
      errors,
      duplicates,
      found30,
      go30,
      pre30
    }
  };
}

export function sourceUsefulnessScore(input: any) {
  return sourceUsefulnessExplain(input).score;
}

export function sourceHealth(stat: any, context?: any) {
  if (!stat && !context) return "unbekannt";
  const score = sourceUsefulnessScore({ stat, ...(context || {}) });
  if ((stat?.lastRunOk === false && n(stat?.errorCountLastRun) >= 2) || score < 35) return "kritisch";
  if (score < 65) return "gelb";
  return "gruen";
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
