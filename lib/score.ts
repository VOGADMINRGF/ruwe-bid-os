import type { Tender } from "./models";

export function weightedPipeline(tenders: Tender[]) {
  return tenders
    .filter((t) => t.decision !== "No-Go")
    .reduce((sum, t) => {
      const factor = t.priority === "A" ? 0.7 : t.priority === "B" ? 0.4 : 0.15;
      return sum + t.estimatedValue * factor;
    }, 0);
}

export function goQuote(tenders: Tender[]) {
  if (!tenders.length) return 0;
  return tenders.filter((t) => t.decision === "Go").length / tenders.length;
}

export function dashboardKPIs(tenders: Tender[]) {
  const neu = tenders.filter((t) => t.status === "neu").length;
  const manual = tenders.filter((t) => t.manualReview === "zwingend").length;
  const goCandidates = tenders.filter((t) => t.decision === "Go").length;
  const offene = tenders.filter((t) => t.decision === "Prüfen").length;
  const ueberfaellig = tenders.filter(
    (t) => t.dueDate && new Date(t.dueDate) < new Date()
  ).length;

  return { neu, manual, goCandidates, offene, ueberfaellig };
}

export function overallAssessment(tenders: Tender[]): "gut" | "gemischt" | "kritisch" {
  const total = tenders.length;
  if (total === 0) return "gemischt";

  const strong = tenders.filter((t) => t.priority === "A" || t.priority === "B").length;
  const go = tenders.filter((t) => t.decision === "Go").length;
  const overdue = tenders.filter(
    (t) => t.dueDate && new Date(t.dueDate) < new Date()
  ).length;

  if (strong / total > 0.5 && go / total > 0.3 && overdue === 0) return "gut";
  if (overdue > 2 || go / total < 0.2) return "kritisch";
  return "gemischt";
}
