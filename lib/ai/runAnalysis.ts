import { readStore, replaceCollection } from "@/lib/storage";
import { analyzeHitWithAI } from "@/lib/ai/analyzeHit";

function normalizeDecision(rec: string) {
  if (rec === "Bid") return "Bid";
  if (rec === "Prüfen") return "Prüfen";
  return "No-Go";
}

function stageFromDecision(decision: string) {
  if (decision === "Bid") return "Qualifiziert";
  if (decision === "Prüfen") return "Review";
  return "Beobachtet";
}

export async function runHitAnalysis() {
  const db = await readStore();
  const hits = [...(db.sourceHits || [])];
  const sites = db.sites || [];
  const rules = db.siteTradeRules || [];
  const buyers = db.buyers || [];
  const agents = db.agents || [];
  const tenders = [...(db.tenders || [])];
  const pipeline = [...(db.pipeline || [])];

  const context = {
    sites,
    rules,
    buyers,
    agents
  };

  const analyzedHits = [];

  for (const hit of hits) {
    const result = await analyzeHitWithAI(hit, context);

    const enriched = {
      ...hit,
      aiRecommendation: normalizeDecision(result.recommendation),
      aiScore: Number(result.score || 0),
      aiSummary: result.summary || "",
      aiReasoning: result.reasoning || [],
      aiRisks: result.risks || [],
      aiNextStep: result.nextStep || "",
      aiProvider: result.provider || "unknown"
    };

    analyzedHits.push(enriched);

    if (enriched.aiRecommendation === "Bid" || enriched.aiRecommendation === "Prüfen") {
      const tenderId = `t_${enriched.id}`;
      const existingTender = tenders.find((t: any) => t.sourceHitId === enriched.id);

      if (!existingTender) {
        tenders.push({
          id: tenderId,
          sourceHitId: enriched.id,
          title: enriched.title,
          region: enriched.region,
          trade: enriched.trade,
          decision: enriched.aiRecommendation,
          manualReview: enriched.aiRecommendation === "Prüfen" ? "zwingend" : "optional",
          distanceKm: enriched.distanceKm,
          dueDate: "",
          buyerId: "",
          ownerId: "",
          stage: stageFromDecision(enriched.aiRecommendation),
          nextStep: enriched.aiNextStep,
          aiScore: enriched.aiScore,
          aiSummary: enriched.aiSummary,
          dataMode: db.meta?.dataMode || "test"
        });
      }

      const existingPipeline = pipeline.find((p: any) => p.sourceHitId === enriched.id);
      if (!existingPipeline) {
        pipeline.push({
          id: `p_${enriched.id}`,
          sourceHitId: enriched.id,
          title: enriched.title,
          stage: stageFromDecision(enriched.aiRecommendation),
          value: Number(enriched.estimatedValue || 0),
          ownerId: "",
          priority: enriched.aiRecommendation === "Bid" ? "A" : "B",
          nextStep: enriched.aiNextStep,
          eowUpdate: "Stage bis Freitag 16:00 aktualisieren",
          aiScore: enriched.aiScore,
          aiProvider: enriched.aiProvider,
          dataMode: db.meta?.dataMode || "test"
        });
      }
    }
  }

  await replaceCollection("sourceHits", analyzedHits);
  await replaceCollection("tenders", tenders);
  await replaceCollection("pipeline", pipeline);

  return {
    ok: true,
    analyzed: analyzedHits.length,
    bid: analyzedHits.filter((x: any) => x.aiRecommendation === "Bid").length,
    review: analyzedHits.filter((x: any) => x.aiRecommendation === "Prüfen").length,
    noGo: analyzedHits.filter((x: any) => x.aiRecommendation === "No-Go").length
  };
}
