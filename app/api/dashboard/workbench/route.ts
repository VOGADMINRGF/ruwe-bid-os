import { NextResponse } from "next/server";
import { buildDashboardWorkbench } from "@/lib/dashboardWorkbench";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const data = await buildDashboardWorkbench({
    trade: searchParams.get("trade") || undefined,
    region: searchParams.get("region") || undefined,
    decision: searchParams.get("decision") || undefined,
    sourceId: searchParams.get("sourceId") || undefined,
    search: searchParams.get("search") || undefined
  });
  return NextResponse.json(data);
}
