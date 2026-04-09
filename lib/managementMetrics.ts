function n(v: any) {
  const x = Number(v || 0);
  return Number.isFinite(x) ? x : 0;
}

function decisionOf(hit: any) {
  return hit?.aiRecommendation || (
    hit?.status === "prefiltered" ? "Bid" :
    hit?.status === "manual_review" ? "Prüfen" :
    "No-Go"
  );
}

function sumVolume(rows: any[]) {
  return rows.reduce((s, x) => s + n(x?.estimatedValue), 0);
}

function compactVolumeText(value: number) {
  const v = n(value);
  if (v >= 1000000) return `${(v / 1000000).toFixed(2).replace(/0$/, "").replace(/\.00$/, "")} Mio. €`;
  if (v >= 1000) return `${(v / 1000).toFixed(0)} Tsd. €`;
  return `${v.toFixed(0)} €`;
}

export function portfolioSummary(db: any) {
  const hits = db?.sourceHits || [];
  const bid = hits.filter((x: any) => decisionOf(x) === "Bid");
  const review = hits.filter((x: any) => decisionOf(x) === "Prüfen");
  const noGo = hits.filter((x: any) => decisionOf(x) === "No-Go");

  return {
    totalCount: hits.length,
    totalVolume: sumVolume(hits),
    bidCount: bid.length,
    bidVolume: sumVolume(bid),
    reviewCount: review.length,
    reviewVolume: sumVolume(review),
    noGoCount: noGo.length,
    noGoVolume: sumVolume(noGo)
  };
}

export function highAttentionCases(db: any) {
  const hits = db?.sourceHits || [];
  return [...hits]
    .map((x: any) => {
      const duration = n(x.durationMonths);
      const volume = n(x.estimatedValue);
      const distance = n(x.distanceKm || 999);
      let attention = 0;

      if (duration >= 36) attention += 35;
      else if (duration >= 24) attention += 24;
      else if (duration >= 12) attention += 12;

      if (volume >= 1000000) attention += 35;
      else if (volume >= 500000) attention += 25;
      else if (volume >= 250000) attention += 15;

      if (distance <= 10) attention += 15;
      else if (distance <= 30) attention += 8;

      if ((x.aiRecommendation || x.status) === "Bid" || x.status === "prefiltered") attention += 20;
      else if ((x.aiRecommendation || x.status) === "Prüfen" || x.status === "manual_review") attention += 10;

      return {
        ...x,
        attentionScore: attention
      };
    })
    .sort((a: any, b: any) => b.attentionScore - a.attentionScore)
    .slice(0, 8);
}

export function missingCoverageCases(db: any) {
  const hits = db?.sourceHits || [];
  return hits
    .filter((x: any) => !x.matchedSiteId || !x.trade || x.trade === "Sonstiges" || n(x.distanceKm) >= 80)
    .map((x: any) => ({
      ...x,
      gapReason:
        !x.matchedSiteId ? "kein Standortmatch" :
        (!x.trade || x.trade === "Sonstiges") ? "Gewerk unklar" :
        "Radius / Abdeckung schwach"
    }))
    .sort((a: any, b: any) => n(b.estimatedValue) - n(a.estimatedValue))
    .slice(0, 10);
}

export function longRunningCases(db: any) {
  const hits = db?.sourceHits || [];
  return [...hits]
    .filter((x: any) => n(x.durationMonths) > 0)
    .sort((a: any, b: any) => n(b.durationMonths) - n(a.durationMonths) || n(b.estimatedValue) - n(a.estimatedValue))
    .slice(0, 8);
}

export function highestVolumeCases(db: any) {
  const hits = db?.sourceHits || [];
  return [...hits]
    .sort((a: any, b: any) => n(b.estimatedValue) - n(a.estimatedValue))
    .slice(0, 8);
}

export function managementNarrative(db: any) {
  const p = portfolioSummary(db);
  const longRun = longRunningCases(db)[0];
  const highVol = highestVolumeCases(db)[0];
  const gaps = missingCoverageCases(db);

  const lead =
    p.bidVolume > 0
      ? `Aktuell sind rund ${compactVolumeText(p.bidVolume)} als aktive Bid-Chance einzuordnen.`
      : "Aktuell ist noch kein belastbares Bid-Volumen sichtbar.";

  const second =
    highVol
      ? `Größter sichtbarer Fall: ${highVol.trade || "Sonstiges"} in ${highVol.region || "Unbekannt"} mit rund ${compactVolumeText(n(highVol.estimatedValue))}.`
      : "Noch kein größter Fall ableitbar.";

  const third =
    longRun
      ? `Längste relevante Laufzeit: ${longRun.trade || "Sonstiges"} in ${longRun.region || "Unbekannt"} mit ${n(longRun.durationMonths)} Monaten.`
      : "Noch keine Laufzeitbesonderheit sichtbar.";

  const fourth =
    gaps.length
      ? `${gaps.length} sichtbare Fälle zeigen aktuell Lücken bei Standort, Gewerk oder Radius.`
      : "Aktuell sind keine größeren Abdeckungslücken sichtbar.";

  return { lead, second, third, fourth };
}
