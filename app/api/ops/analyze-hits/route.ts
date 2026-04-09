import { NextResponse } from "next/server";
import { runHitAnalysis } from "@/lib/ai/runAnalysis";

export async function POST(req: Request) {
  try {
    const result = await runHitAnalysis();
    const url = new URL(req.url);
    if (url.searchParams.get("redirect") === "1") {
      return NextResponse.redirect(new URL("/dashboard/ai-results", req.url));
    }
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || "analysis_failed" },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const result = await runHitAnalysis();
    const url = new URL(req.url);
    if (url.searchParams.get("redirect") === "1") {
      return NextResponse.redirect(new URL("/dashboard/ai-results", req.url));
    }
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || "analysis_failed" },
      { status: 500 }
    );
  }
}
