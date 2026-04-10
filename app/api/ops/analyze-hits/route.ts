import { NextResponse } from "next/server";
import { readStore, replaceCollection } from "@/lib/storage";
import { orchestrateHitAnalysis } from "@/lib/aiOrchestrator";
import { isAiCandidate } from "@/lib/aiGatekeeper";

function wantsRedirect(req: Request) {
  const url = new URL(req.url);
  return url.searchParams.get("redirect") === "1";
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const force = url.searchParams.get("force") === "1";
    const db = await readStore();
    let hits = [...(db.sourceHits || [])];
    hits = hits.map((hit: any) => {
      const gate = isAiCandidate(hit);
      return {
        ...hit,
        aiGateAllowed: gate.allowed,
        aiGateReason: gate.reason,
        aiGateScore: gate.score ?? null,
        aiGateSignals: Array.isArray(gate.signals) ? gate.signals : [],
        aiGateAt: new Date().toISOString()
      };
    });
    await replaceCollection("sourceHits", hits);

    const pending = hits.filter((hit: any) => !hit.aiAnalyzedAt || !hit.aiRecommendation || hit.aiAnalysisStatus !== "done");
    const candidates = force ? pending : pending.filter((hit: any) => hit.aiGateAllowed === true);
    const limited = candidates
      .sort((a: any, b: any) => Number(b.aiGateScore || 0) - Number(a.aiGateScore || 0))
      .slice(0, 15);

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
      skipped: hits.length - limited.length,
      force
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

export async function POST(req: Request) {
  return GET(req);
}
