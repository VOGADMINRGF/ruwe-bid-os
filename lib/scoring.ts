import { Tender } from "./types";

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

export function overallAssessment(tenders: Tender[]) {
  if (!tenders.length) return "gemischt";
  const total = tenders.length;
  const go = tenders.filter((t) => t.decision === "Go").length / total;
  const overdue = overdueCount(tenders);
  const noGo = tenders.filter((t) => t.decision === "No-Go").length / total;

  if (go >= 0.25 && overdue === 0) return "gut";
  if (overdue >= 2 || noGo > 0.5) return "kritisch";
  return "gemischt";
}
