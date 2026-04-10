import { enrichHitsStrictAndLearn } from "@/lib/hitEnrichment";
import { enrichOpportunitiesWithFit } from "@/lib/opportunityEnrichment";
import { rebuildOpportunities } from "@/lib/opportunityRebuild";
import { probeDeepLinks } from "@/lib/deepLinkProbe";
import { isAiCandidate, selectAiCandidates } from "@/lib/aiGatekeeper";
import { orchestrateHitAnalysis } from "@/lib/aiOrchestrator";
import { refreshAllSources } from "@/lib/sourceRefreshOrchestrator";
import { rescanSourceHits } from "@/lib/sourceScanner";
import { readStore, replaceCollection } from "@/lib/storage";
import { appendAuditLog } from "@/lib/auditLog";

function nowIso() {
  return new Date().toISOString();
}

export async function runAllPhases() {
  const phases: any[] = [];

  phases.push({ key: "source_refresh", status: "running", startedAt: nowIso() });
  const sourceRefresh = await refreshAllSources();
  phases[0] = {
    ...phases[0],
    status: sourceRefresh.ok ? "done" : "warning",
    result: sourceRefresh,
    finishedAt: nowIso()
  };

  phases.push({ key: "deep_link_probe", status: "running", startedAt: nowIso() });
  const probe = await probeDeepLinks();
  phases[1] = {
    ...phases[1],
    status: "done",
    result: probe,
    finishedAt: nowIso()
  };

  phases.push({ key: "understanding", status: "running", startedAt: nowIso() });
  const enrich = await enrichHitsStrictAndLearn();
  const scan = await rescanSourceHits();
  phases[2] = {
    ...phases[2],
    status: "done",
    result: { enrich, scan },
    finishedAt: nowIso()
  };

  phases.push({ key: "gate", status: "running", startedAt: nowIso() });
  const dbAfterGate = await readStore();
  const gatedHits = (dbAfterGate.sourceHits || []).map((hit: any) => {
    const gate = isAiCandidate(hit);
    return {
      ...hit,
      aiGateAllowed: gate.allowed,
      aiGateReason: gate.reason,
      aiGateScore: gate.score ?? null,
      aiGateSignals: Array.isArray(gate.signals) ? gate.signals : [],
      aiGateAt: nowIso()
    };
  });
  await replaceCollection("sourceHits", gatedHits);
  const candidates = selectAiCandidates(gatedHits, 20);
  phases[3] = {
    ...phases[3],
    status: "done",
    result: {
      totalHits: gatedHits.length,
      aiCandidates: candidates.length
    },
    finishedAt: nowIso()
  };

  phases.push({ key: "ai", status: "running", startedAt: nowIso() });
  const aiHits = [...gatedHits];
  for (const row of candidates) {
    const analysis = await orchestrateHitAnalysis(row.hit);
    const idx = aiHits.findIndex((x: any) => x.id === row.hit.id);
    if (idx >= 0) {
      aiHits[idx] = {
        ...aiHits[idx],
        ...analysis
      };
    }
  }
  await replaceCollection("sourceHits", aiHits);
  phases[4] = {
    ...phases[4],
    status: "done",
    result: {
      analyzed: candidates.length
    },
    finishedAt: nowIso()
  };

  phases.push({ key: "opportunity_rebuild", status: "running", startedAt: nowIso() });
  const rebuild = await rebuildOpportunities();
  const fit = await enrichOpportunitiesWithFit();
  phases[5] = {
    ...phases[5],
    status: "done",
    result: { rebuild, fit },
    finishedAt: nowIso()
  };

  phases.push({ key: "done", status: "done", startedAt: nowIso(), finishedAt: nowIso() });

  const dbFinal = await readStore();
  await replaceCollection("meta", {
    ...(dbFinal.meta || {}),
    lastRunAllAt: nowIso(),
    lastRunAllPhases: phases
  });

  await appendAuditLog({
    action: "ops.run_all_phased",
    entityType: "ops_run",
    entityId: null,
    details: {
      hits: (dbFinal.sourceHits || []).length,
      usableHits: (dbFinal.sourceHits || []).filter((x: any) => x.operationallyUsable === true).length,
      opportunities: (dbFinal.opportunities || []).length,
      missingVariables: (dbFinal.costGaps || []).length
    }
  });

  return {
    ok: true,
    phases,
    summary: {
      hits: (dbFinal.sourceHits || []).length,
      usableHits: (dbFinal.sourceHits || []).filter((x: any) => x.operationallyUsable === true).length,
      invalidLinks: (dbFinal.sourceHits || []).filter((x: any) => x.directLinkValid !== true).length,
      aiGateAllowed: (dbFinal.sourceHits || []).filter((x: any) => x.aiGateAllowed === true).length,
      aiGateBlocked: (dbFinal.sourceHits || []).filter((x: any) => x.aiGateAllowed === false).length,
      aiAnalyzedHits: (dbFinal.sourceHits || []).filter((x: any) => !!x.aiAnalyzedAt).length,
      opportunities: (dbFinal.opportunities || []).length,
      missingVariables: (dbFinal.costGaps || []).length
    }
  };
}
