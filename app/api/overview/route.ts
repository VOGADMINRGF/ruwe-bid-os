import { NextResponse } from "next/server";
import { readDb } from "@/lib/db";
import { goQuote, manualQueueCount, overdueCount, overallAssessment, weightedPipeline } from "@/lib/scoring";

export async function GET() {
  const db = await readDb();
  const tenders = db.tenders || [];
  const pipeline = db.pipeline || [];
  const response = {
    kpis: {
      newCount: tenders.filter((t: any) => t.status === "neu").length,
      manualCount: manualQueueCount(tenders),
      goCount: tenders.filter((t: any) => t.decision === "Go").length,
      overdueCount: overdueCount(tenders),
      overallAssessment: overallAssessment(tenders),
      weightedPipeline: weightedPipeline(pipeline),
      goQuote: goQuote(tenders)
    }
  };
  return NextResponse.json(response);
}
