#!/bin/bash
set -e

cd ~/Arbeitsmappe/ruwe-bid-os

echo "🔧 RUWE AI Debug Fix"

mkdir -p lib/ai app/api/ops/analyze-hits

cat > lib/ai/providers.ts <<'TS'
function extractJson(text: string) {
  const trimmed = (text || "").trim();
  try {
    return JSON.parse(trimmed);
  } catch {}

  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start >= 0 && end > start) {
    return JSON.parse(trimmed.slice(start, end + 1));
  }
  throw new Error("No JSON found in model response");
}

async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs = 30000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    return res;
  } finally {
    clearTimeout(timer);
  }
}

export async function analyzeWithOpenAI(prompt: string) {
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL || "gpt-4.1-mini";
  if (!apiKey) throw new Error("OPENAI_API_KEY missing");

  console.log("[AI] OpenAI request start", { model });

  const res = await fetchWithTimeout("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      input: prompt
    })
  }, 30000);

  const txt = await res.text();
  if (!res.ok) {
    throw new Error(`OpenAI error ${res.status}: ${txt}`);
  }

  const json = JSON.parse(txt);
  const text =
    json.output_text ||
    json.output?.map((x: any) => x?.content?.map((c: any) => c?.text).join(" ")).join(" ") ||
    "";

  console.log("[AI] OpenAI request done");

  return {
    provider: `openai:${model}`,
    data: extractJson(text)
  };
}

export async function analyzeWithAnthropic(prompt: string) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  const model = process.env.ANTHROPIC_MODEL || "claude-3-5-sonnet-latest";
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY missing");

  console.log("[AI] Anthropic request start", { model });

  const res = await fetchWithTimeout("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01"
    },
    body: JSON.stringify({
      model,
      max_tokens: 900,
      messages: [{ role: "user", content: prompt }]
    })
  }, 30000);

  const txt = await res.text();
  if (!res.ok) {
    throw new Error(`Anthropic error ${res.status}: ${txt}`);
  }

  const json = JSON.parse(txt);
  const text = (json.content || []).map((c: any) => c?.text || "").join("\n");

  console.log("[AI] Anthropic request done");

  return {
    provider: `anthropic:${model}`,
    data: extractJson(text)
  };
}

export async function analyzeWithAvailableProvider(prompt: string) {
  const hasOpenAI = !!process.env.OPENAI_API_KEY;
  const hasAnthropic = !!process.env.ANTHROPIC_API_KEY;

  console.log("[AI] Providers", {
    openai: hasOpenAI,
    anthropic: hasAnthropic
  });

  if (hasOpenAI) {
    try {
      return await analyzeWithOpenAI(prompt);
    } catch (err: any) {
      console.error("[AI] OpenAI failed:", err?.message || err);
      if (!hasAnthropic) throw err;
    }
  }

  if (hasAnthropic) {
    return await analyzeWithAnthropic(prompt);
  }

  throw new Error("No AI provider configured");
}
TS

cat > lib/ai/runAnalysis.ts <<'TS'
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
TS

cat > app/api/ops/analyze-hits/route.ts <<'TS'
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
TS

npm run build || true
git add lib/ai/providers.ts lib/ai/runAnalysis.ts app/api/ops/analyze-hits/route.ts
git commit -m "fix: add ai timeouts, provider logging and limited batch analysis for debugging" || true
git push origin main || true

echo "✅ AI Debug Fix eingebaut."
