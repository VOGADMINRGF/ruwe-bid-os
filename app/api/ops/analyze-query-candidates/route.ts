import { NextResponse } from "next/server";
import { readStore, replaceCollection } from "@/lib/storage";
import { orchestrateHitAnalysis } from "@/lib/aiOrchestrator";
import { isAiCandidate } from "@/lib/aiGatekeeper";

export async function POST() {
  const db = await readStore();
  const hits = [...(db.sourceHits || [])];

  const candidates = hits.filter((hit: any) => {
    const discoveryOk = ["search_query", "manual_import"].includes(hit.discoveryMode);
    const gate = isAiCandidate(hit);
    const notDone = !hit.aiAnalyzedAt || hit.aiAnalysisStatus !== "done";
    return discoveryOk && gate.allowed && notDone;
  }).slice(0, 10);

  for (const hit of candidates) {
    const analysis = await orchestrateHitAnalysis(hit);
    const idx = hits.findIndex((x: any) => x.id === hit.id);
    if (idx >= 0) hits[idx] = { ...hits[idx], ...analysis };
  }

  await replaceCollection("sourceHits", hits);

  return NextResponse.json({
    ok: true,
    analyzed: candidates.length
  });
}
