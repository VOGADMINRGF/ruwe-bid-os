import { NextResponse } from "next/server";
import { buildDashboardWorkbench } from "@/lib/dashboardWorkbench";
import { buildOwnerWorkload } from "@/lib/ownerWorkload";
import { readStore } from "@/lib/storage";

export async function GET() {
  const [dashboard, workload, db] = await Promise.all([
    buildDashboardWorkbench({}),
    buildOwnerWorkload(),
    readStore()
  ]);

  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    kpis: dashboard.kpis,
    topTradeMatrix: dashboard.tradeMatrix.slice(0, 10),
    topRegionTrade: dashboard.regionTradeRows.slice(0, 20),
    ownerWorkload: workload,
    openVariables: (db.costGaps || []).filter((x: any) => x.status !== "beantwortet").length,
    opportunities: (db.opportunities || []).length
  });
}

