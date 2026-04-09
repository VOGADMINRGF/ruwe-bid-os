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

export async function runHitAnalysis(limit = 5) {
  const db = await readStore();
  const hits = [...(db.sourceHits || [])].slice(0, limit);
  const allHits = [...(db.sourceHits || [])];
  const sites = db.sites || [];
  const rules = db.siteTradeRules || [];
  const buyers = db.buyers || [];
  const agents = db.agents || [];
  const tenders = [...(db.tenders || [])];
  const pipeline = [...(db.pipeline || [])];

  const context = { sites, rules, buyers, agents };
  const updates = new Map<string, any>();

  for (const hit of hits) {
    console.log("[AI] Analyze hit start", { id: hit.id, title: hit.title });

    try {
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

      updates.set(hit.id, enriched);

      if (enriched.aiRecommendation === "Bid" || enriched.aiRecommendation === "Prüfen") {
        const existingTender = tenders.find((t: any) => t.sourceHitId === enriched.id);
        if (!existingTender) {
          tenders.push({
            id: `t_${enriched.id}`,
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

      console.log("[AI] Analyze hit done", {
        id: hit.id,
        recommendation: enriched.aiRecommendation,
        provider: enriched.aiProvider
      });
    } catch (err: any) {
      console.error("[AI] Analyze hit failed", {
        id: hit.id,
        title: hit.title,
        error: err?.message || err
      });

      updates.set(hit.id, {
        ...hit,
        aiRecommendation: "Fehler",
        aiScore: 0,
        aiSummary: err?.message || "analysis_failed",
        aiReasoning: [],
        aiRisks: ["Analyse fehlgeschlagen"],
        aiNextStep: "Provider / Schlüssel / Antwortformat prüfen",
        aiProvider: "error"
      });
    }
  }

  const analyzedHits = allHits.map((hit: any) => updates.get(hit.id) || hit);

  await replaceCollection("sourceHits", analyzedHits);
  await replaceCollection("tenders", tenders);
  await replaceCollection("pipeline", pipeline);

  return {
    ok: true,
    analyzed: hits.length,
    bid: analyzedHits.filter((x: any) => x.aiRecommendation === "Bid").length,
    review: analyzedHits.filter((x: any) => x.aiRecommendation === "Prüfen").length,
    noGo: analyzedHits.filter((x: any) => x.aiRecommendation === "No-Go").length,
    errors: analyzedHits.filter((x: any) => x.aiRecommendation === "Fehler").length
  };
}
