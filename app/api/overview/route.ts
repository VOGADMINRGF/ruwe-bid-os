import { NextResponse } from "next/server";
import { readStore } from "@/lib/storage";
import { goQuote, manualQueueCount, overdueCount, overallAssessment, weightedPipeline } from "@/lib/scoring";
import { prefilteredCount, siteCoverage } from "@/lib/siteLogic";

export async function GET() {
  const db = await readStore();
  const tenders = db.tenders || [];
  const sites = db.sites || [];
  const rules = db.siteTradeRules || [];
  const pipeline = db.pipeline || [];
  const sourceStats = db.sourceStats || [];

  return NextResponse.json({
    total: tenders.length,
    prefiltered: prefilteredCount(tenders),
    manual: manualQueueCount(tenders),
    go: tenders.filter((t: any) => t.decision === "Go").length,
    noGo: tenders.filter((t: any) => t.decision === "No-Go").length,
    weightedPipeline: weightedPipeline(pipeline),
    goQuote: goQuote(tenders),
    overdue: overdueCount(tenders),
    overall: overallAssessment(tenders),
    activeSites: sites.filter((s: any) => s.active).length,
    activeRules: rules.filter((r: any) => r.enabled).length,
    coverage: siteCoverage(sites, rules, tenders),
    sourceStats
  });
}
