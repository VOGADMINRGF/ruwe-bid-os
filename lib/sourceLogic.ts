export function sourceUsefulnessScore(stat: any) {
  const found = stat.tendersLast30Days || 0;
  const pre = stat.prefilteredLast30Days || 0;
  const go = stat.goLast30Days || 0;
  const errors = stat.errorCountLastRun || 0;
  const dup = stat.duplicateCountLastRun || 0;
  return Math.max(0, found + pre * 2 + go * 4 - errors * 5 - dup);
}

export function sourceHealth(stat: any) {
  if (!stat) return "unbekannt";
  if (stat.lastRunOk && (stat.errorCountLastRun || 0) === 0) return "grün";
  if ((stat.errorCountLastRun || 0) <= 1) return "gelb";
  return "kritisch";
}

export function smokeSummary(db: any) {
  const hits = db.sourceHits || [];
  return {
    mode: db.meta?.dataMode || "demo",
    totalHits: hits.length,
    newSinceLastFetch: hits.filter((x: any) => x.addedSinceLastFetch).length,
    prefiltered: hits.filter((x: any) => x.status === "prefiltered").length,
    manualReview: hits.filter((x: any) => x.status === "manual_review").length,
    observed: hits.filter((x: any) => x.status === "observed").length,
    bySource: (db.sourceRegistry || []).map((src: any) => ({
      source: src.name,
      hits: hits.filter((h: any) => h.sourceId === src.id).length
    }))
  };
}

export function aiSmokeForHit(hit: any) {
  let score = 0;
  const reasons: string[] = [];

  if ((hit.distanceKm || 999) <= 10) { score += 30; reasons.push("kurze Distanz"); }
  else if ((hit.distanceKm || 999) <= 30) { score += 20; reasons.push("solide Distanz"); }

  if ((hit.estimatedValue || 0) >= 500000) { score += 25; reasons.push("attraktives Volumen"); }
  else { score += 10; reasons.push("kleineres Volumen"); }

  if ((hit.durationMonths || 0) >= 24) { score += 20; reasons.push("längere Laufzeit"); }
  else { score += 8; reasons.push("kürzere Laufzeit"); }

  if (hit.status === "prefiltered") { score += 20; reasons.push("bereits vorqualifiziert"); }
  else if (hit.status === "manual_review") { score += 10; reasons.push("manuelle Prüfung empfohlen"); }

  const recommendation = score >= 80 ? "Bid" : score >= 55 ? "Prüfen" : "No-Go";
  const explanation =
    recommendation === "Bid"
      ? "Der Treffer passt gut zu Reichweite, Volumen und aktueller Bearbeitungslogik."
      : recommendation === "Prüfen"
        ? "Der Treffer ist relevant, sollte aber manuell gegen Kapazität und Leistungsumfang geprüft werden."
        : "Der Treffer ist aktuell operativ oder wirtschaftlich nicht vorrangig.";

  return { recommendation, score, reasons, explanation };
}
