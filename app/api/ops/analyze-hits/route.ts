import { NextResponse } from "next/server";
import { runHitAnalysis } from "@/lib/ai/runAnalysis";

function getLimit(req: Request) {
  const url = new URL(req.url);
  const value = Number(url.searchParams.get("limit") || "5");
  if (!Number.isFinite(value) || value <= 0) return 5;
  return Math.min(value, 20);
}

export async function POST(req: Request) {
  try {
    const limit = getLimit(req);
    const result = await runHitAnalysis(limit);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("[AI] Route failed", error?.message || error);
    return NextResponse.json(
      { ok: false, error: error?.message || "analysis_failed" },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const limit = getLimit(req);
    const result = await runHitAnalysis(limit);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("[AI] Route failed", error?.message || error);
    return NextResponse.json(
      { ok: false, error: error?.message || "analysis_failed" },
      { status: 500 }
    );
  }
}
