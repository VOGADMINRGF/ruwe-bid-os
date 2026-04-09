import { Tender, Zone, Buyer } from "./types";

export function tenderPriorityWeight(priority: Tender["priority"]) {
  if (priority === "A") return 0.7;
  if (priority === "B") return 0.4;
  return 0.15;
}

export function weightedPipeline(items: { value: number }[]) {
  return items.reduce((sum, item) => sum + item.value, 0);
}

export function goQuote(tenders: Tender[]) {
  if (!tenders.length) return 0;
  return tenders.filter((t) => t.decision === "Go").length / tenders.length;
}

export function manualQueueCount(tenders: Tender[]) {
  return tenders.filter((t) => t.manualReview === "zwingend" || t.decision === "Prüfen").length;
}

export function overdueCount(tenders: Tender[]) {
  const now = new Date();
  return tenders.filter((t) => t.dueDate && new Date(t.dueDate) < now && t.decision !== "No-Go").length;
}

export function strongCount(tenders: Tender[]) {
  return tenders.filter((t) => t.priority === "A" || t.priority === "B").length;
}

export function overallAssessment(tenders: Tender[]) {
  if (!tenders.length) return "gemischt";
  const total = tenders.length;
  const go = tenders.filter((t) => t.decision === "Go").length / total;
  const strong = strongCount(tenders) / total;
  const overdue = overdueCount(tenders);

  if (strong >= 0.4 && go >= 0.25 && overdue === 0) return "gut";
  if (go <= 0.15 || overdue >= 2) return "kritisch";
  return "gemischt";
}

export function fitScore(tender: Tender, zone?: Zone, buyer?: Buyer) {
  let score = 0;

  if (tender.priority === "A") score += 30;
  else if (tender.priority === "B") score += 20;
  else score += 8;

  if (zone) {
    if (zone.priorityTrades.includes(tender.trade)) score += 30;
    else if (zone.supportedTrades.includes(tender.trade)) score += 18;
    else score += 4;
  }

  if (buyer?.strategic) score += 20;
  else score += 10;

  if (tender.manualReview === "nein") score += 10;
  else if (tender.manualReview === "optional") score += 5;

  if (tender.riskLevel === "niedrig") score += 10;
  else if (tender.riskLevel === "mittel") score += 5;

  return Math.min(score, 100);
}
