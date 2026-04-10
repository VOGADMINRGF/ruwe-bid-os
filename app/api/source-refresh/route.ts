import { NextResponse } from "next/server";
import { refreshAllSources } from "@/lib/sourceRefreshOrchestrator";

export async function POST() {
  const result = await refreshAllSources();
  return NextResponse.json({
    ok: result.ok,
    refreshedAt: result.finishedAt,
    summary: result.summary,
    results: result.results
  });
}

export async function GET() {
  return POST();
}
