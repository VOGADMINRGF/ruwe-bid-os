import { deadlineView, forecastRecommendations } from "@/lib/forecastLogic";
import { sourceUsefulnessScore } from "@/lib/sourceLogic";

export function topDeadlineStats(db: any) {
  const tenders = deadlineView(db.tenders || []);
  return {
    due7: tenders.filter((x: any) => x.daysLeft >= 0 && x.daysLeft <= 7).length,
    due14: tenders.filter((x: any) => x.daysLeft >= 8 && x.daysLeft <= 14).length,
    overdue: tenders.filter((x: any) => x.daysLeft < 0).length
  };
}

export function topForecastCards(db: any) {
  const rows = forecastRecommendations(db.sourceHits || []);
  return rows.slice(0, 4);
}

export function sourcePerformanceRows(db: any) {
  const registry = db.sourceRegistry || [];
  const stats = db.sourceStats || [];

  return registry.map((src: any) => {
    const stat = stats.find((s: any) => s.id === src.id) || {};
    return {
      id: src.id,
      name: src.name,
      legalUse: src.legalUse || "-",
      lastFetchAt: stat.lastFetchAt || "",
      tendersLast30Days: stat.tendersLast30Days || 0,
      tendersSinceLastFetch: stat.tendersSinceLastFetch || 0,
      prefilteredLast30Days: stat.prefilteredLast30Days || 0,
      goLast30Days: stat.goLast30Days || 0,
      score: sourceUsefulnessScore(stat),
      lastRunOk: !!stat.lastRunOk,
      errors: stat.errorCountLastRun || 0
    };
  }).sort((a: any, b: any) => b.score - a.score);
}

export function pipelineStageSummary(db: any) {
  const rows = db.pipeline || [];
  const stages = ["Qualifiziert", "Review", "Freigabe intern", "Angebot", "Beobachtet", "Eingereicht", "Verhandlung", "Gewonnen", "Verloren"];
  return stages.map((stage) => {
    const items = rows.filter((x: any) => x.stage === stage);
    return {
      stage,
      count: items.length,
      value: items.reduce((sum: number, x: any) => sum + Number(x.value || 0), 0)
    };
  }).filter((x) => x.count > 0);
}

export function managementSummary(db: any) {
  const hits = db.sourceHits || [];
  const bid = hits.filter((x: any) => x.aiRecommendation === "Bid" || x.status === "prefiltered").length;
  const review = hits.filter((x: any) => x.aiRecommendation === "Prüfen" || x.status === "manual_review").length;
  const total = hits.length;

  const forecast = topForecastCards(db);
  const top1 = forecast[0];
  const top2 = forecast[1];

  return {
    totalHits: total,
    bid,
    review,
    leadText:
      top1
        ? `${top1.trade} in ${top1.region} wirkt aktuell am attraktivsten.`
        : "Noch keine belastbare Fokusregion vorhanden.",
    secondText:
      top2
        ? `Danach folgt ${top2.trade} in ${top2.region}.`
        : "Weitere Quellenläufe erhöhen die Aussagekraft."
  };
}
