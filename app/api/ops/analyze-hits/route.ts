import { NextResponse } from "next/server";
import { readStore, replaceCollection } from "@/lib/storage";
import { orchestrateHitAnalysis } from "@/lib/aiOrchestrator";

function wantsRedirect(req: Request) {
  const url = new URL(req.url);
  return url.searchParams.get("redirect") === "1";
}

export async function GET(req: Request) {
  try {
    const db = await readStore();
    const hits = [...(db.sourceHits || [])];

    const candidates = hits.filter((hit: any) => {
      return !hit.aiAnalyzedAt || !hit.aiRecommendation || hit.aiAnalysisStatus !== "done";
    });

    const limited = candidates.slice(0, 15);

    for (let i = 0; i < limited.length; i++) {
      const current = limited[i];
      const analysis = await orchestrateHitAnalysis(current);
      const idx = hits.findIndex((x: any) => x.id === current.id);
      if (idx >= 0) {
        hits[idx] = {
          ...hits[idx],
          ...analysis
        };
      }
    }

    await replaceCollection("sourceHits", hits);

    const meta = {
      ...(db.meta || {}),
      lastAiAnalysisAt: new Date().toISOString(),
      lastAiAnalysisCount: limited.length,
      aiAnalysisMode: "gpt-primary_claude-second-opinion"
    };
    await replaceCollection("meta", meta);

    if (wantsRedirect(req)) {
      return NextResponse.redirect(new URL("/", req.url));
    }

    return NextResponse.json({
      ok: true,
      analyzed: limited.length,
      skipped: hits.length - limited.length
    });
  } catch (error: any) {
    if (wantsRedirect(req)) {
      return NextResponse.redirect(new URL(`/?ai_error=${encodeURIComponent(error?.message || "analyze_failed")}`, req.url));
    }
    return NextResponse.json(
      { ok: false, error: error?.message || "analyze_failed" },
      { status: 500 }
    );
  }
}
