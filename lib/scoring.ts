export function weightedPipeline(items: { value: number }[]) {
  return items.reduce((sum, item) => sum + item.value, 0);
}

export function goQuote(tenders: any[]) {
  if (!tenders.length) return 0;
  return tenders.filter((t) => t.decision === "Go").length / tenders.length;
}

export function manualQueueCount(tenders: any[]) {
  return tenders.filter((t) => t.manualReview === "zwingend" || t.decision === "Prüfen").length;
}

export function overdueCount(tenders: any[]) {
  const now = new Date();
  return tenders.filter((t) => t.dueDate && new Date(t.dueDate) < now && t.decision !== "No-Go").length;
}

export function overallAssessment(tenders: any[]) {
  if (!tenders.length) return "gemischt";
  const total = tenders.length;
  const go = tenders.filter((t) => t.decision === "Go").length / total;
  const overdue = overdueCount(tenders);
  const noGo = tenders.filter((t) => t.decision === "No-Go").length / total;

  if (go >= 0.25 && overdue === 0) return "gut";
  if (overdue >= 2 || noGo > 0.5) return "kritisch";
  return "gemischt";
}

export function fitScore(tender: any, zone?: any, buyer?: any) {
  let score = 0;

  if (tender.priority === "A") score += 30;
  else if (tender.priority === "B") score += 20;
  else score += 8;

  if (zone) {
    if (Array.isArray(zone.priorityTrades) && zone.priorityTrades.includes(tender.trade)) score += 30;
    else if (Array.isArray(zone.supportedTrades) && zone.supportedTrades.includes(tender.trade)) score += 18;
    else score += 4;
  }

  if (buyer?.strategic) score += 20;
  else score += 10;

  if (tender.manualReview === "nein") score += 10;
  else if (tender.manualReview === "optional") score += 5;

  if (tender.riskLevel === "niedrig") score += 10;
  else if (tender.riskLevel === "mittel") score += 5;

  if (typeof tender.distanceKm === "number") {
    if (tender.distanceKm <= 25) score += 10;
    else if (tender.distanceKm <= 50) score += 6;
    else if (tender.distanceKm <= 75) score += 3;
  }

  return Math.min(score, 100);
}
