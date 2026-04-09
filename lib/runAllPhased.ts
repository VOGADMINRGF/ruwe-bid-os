import { readStore, replaceCollection } from "@/lib/storage";
import { enrichHitsStrictAndLearn } from "@/lib/hitEnrichment";
import { rescanSourceHits } from "@/lib/sourceScanner";
import { selectAiCandidates } from "@/lib/aiGatekeeper";
import { orchestrateHitAnalysis } from "@/lib/aiOrchestrator";

export async function runAllPhases(origin: string) {
  const phases: any[] = [];

  phases.push({ key: "fetch", status: "running", startedAt: new Date().toISOString() });

  const ingestRes = await fetch(`${origin}/api/ops/live-ingest`, { cache: "no-store" });
  const ingest = await ingestRes.json();
  phases[0] = { ...phases[0], status: "done", result: ingest, finishedAt: new Date().toISOString() };

  phases.push({ key: "validate", status: "running", startedAt: new Date().toISOString() });
  const enrich = await enrichHitsStrictAndLearn();
  const scan = await rescanSourceHits();
  phases[1] = { ...phases[1], status: "done", result: { enrich, scan }, finishedAt: new Date().toISOString() };

  phases.push({ key: "gate", status: "running", startedAt: new Date().toISOString() });
  const dbAfterGate = await readStore();
  const candidates = selectAiCandidates(dbAfterGate.sourceHits || [], 12);
  phases[2] = {
    ...phases[2],
    status: "done",
    result: {
      totalHits: (dbAfterGate.sourceHits || []).length,
      aiCandidates: candidates.length
    },
    finishedAt: new Date().toISOString()
  };

  phases.push({ key: "ai", status: "running", startedAt: new Date().toISOString() });
  const hits = [...(dbAfterGate.sourceHits || [])];

  for (const row of candidates) {
    const analysis = await orchestrateHitAnalysis(row.hit);
    const idx = hits.findIndex((x: any) => x.id === row.hit.id);
    if (idx >= 0) hits[idx] = { ...hits[idx], ...analysis };
  }

  await replaceCollection("sourceHits", hits);
  phases[3] = {
    ...phases[3],
    status: "done",
    result: { analyzed: candidates.length },
    finishedAt: new Date().toISOString()
  };

  phases.push({ key: "done", status: "done", startedAt: new Date().toISOString(), finishedAt: new Date().toISOString() });

  const dbFinal = await readStore();
  const meta = {
    ...(dbFinal.meta || {}),
    lastRunAllAt: new Date().toISOString(),
    lastRunAllPhases: phases
  };
  await replaceCollection("meta", meta);

  return {
    ok: true,
    phases,
    summary: {
      hits: (dbFinal.sourceHits || []).length,
      usableHits: (dbFinal.sourceHits || []).filter((x: any) => x.operationallyUsable).length,
      aiEligibleHits: (dbFinal.sourceHits || []).filter((x: any) => x.aiEligible).length,
      aiAnalyzedHits: (dbFinal.sourceHits || []).filter((x: any) => x.aiAnalyzedAt).length
    }
  };
}
