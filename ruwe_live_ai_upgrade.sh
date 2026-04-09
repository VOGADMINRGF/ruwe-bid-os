#!/bin/bash
set -e

cd ~/Arbeitsmappe/ruwe-bid-os

echo "🚀 RUWE Bid OS — Live + AI Upgrade"

mkdir -p lib/ai
mkdir -p app/api/ops/analyze-hits
mkdir -p app/dashboard/ai-results

echo "📦 package.json scripts ergänzen ..."
node - <<'NODE'
const fs = require("fs");
const path = "package.json";
const pkg = JSON.parse(fs.readFileSync(path, "utf8"));
pkg.scripts = pkg.scripts || {};
pkg.scripts["ops:live"] = "curl -s http://localhost:3000/api/ops/live-ingest";
pkg.scripts["ops:analyze"] = "curl -s -X POST http://localhost:3000/api/ops/analyze-hits";
fs.writeFileSync(path, JSON.stringify(pkg, null, 2) + "\n");
NODE

echo "🧠 AI Provider Layer ..."
cat > lib/ai/providers.ts <<'TS'
type ProviderResult = {
  provider: string;
  raw: string;
};

function extractJson(text: string) {
  const trimmed = text.trim();
  try {
    return JSON.parse(trimmed);
  } catch {}

  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start >= 0 && end > start) {
    const sliced = trimmed.slice(start, end + 1);
    return JSON.parse(sliced);
  }
  throw new Error("No JSON found in model response");
}

export async function analyzeWithOpenAI(prompt: string) {
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL || "gpt-4.1-mini";
  if (!apiKey) throw new Error("OPENAI_API_KEY missing");

  const res = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      input: prompt
    })
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`OpenAI error: ${res.status} ${txt}`);
  }

  const json = await res.json();
  const text =
    json.output_text ||
    json.output?.map((x: any) => x?.content?.map((c: any) => c?.text).join(" ")).join(" ") ||
    "";

  return {
    provider: `openai:${model}`,
    data: extractJson(text)
  };
}

export async function analyzeWithAnthropic(prompt: string) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  const model = process.env.ANTHROPIC_MODEL || "claude-3-5-sonnet-latest";
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY missing");

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01"
    },
    body: JSON.stringify({
      model,
      max_tokens: 900,
      messages: [
        {
          role: "user",
          content: prompt
        }
      ]
    })
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Anthropic error: ${res.status} ${txt}`);
  }

  const json = await res.json();
  const text = (json.content || [])
    .map((c: any) => c?.text || "")
    .join("\n");

  return {
    provider: `anthropic:${model}`,
    data: extractJson(text)
  };
}

export async function analyzeWithAvailableProvider(prompt: string) {
  const hasOpenAI = !!process.env.OPENAI_API_KEY;
  const hasAnthropic = !!process.env.ANTHROPIC_API_KEY;

  if (hasOpenAI) {
    try {
      return await analyzeWithOpenAI(prompt);
    } catch (err) {
      if (!hasAnthropic) throw err;
    }
  }

  if (hasAnthropic) {
    return await analyzeWithAnthropic(prompt);
  }

  throw new Error("No AI provider configured");
}
TS

echo "🧠 AI Scoring Logic ..."
cat > lib/ai/analyzeHit.ts <<'TS'
import { analyzeWithAvailableProvider } from "@/lib/ai/providers";

function fallbackAnalysis(hit: any) {
  const distance = Number(hit.distanceKm || 999);
  const value = Number(hit.estimatedValue || 0);
  const duration = Number(hit.durationMonths || 0);

  let score = 0;
  const reasons: string[] = [];
  const risks: string[] = [];

  if (distance <= 10) {
    score += 30;
    reasons.push("sehr kurze Distanz");
  } else if (distance <= 30) {
    score += 20;
    reasons.push("vertretbare Distanz");
  } else if (distance <= 60) {
    score += 10;
    reasons.push("nur erweiterter Radius");
    risks.push("Anfahrt und Einsatzlogik prüfen");
  } else {
    risks.push("außerhalb sinnvoller Reichweite");
  }

  if (value >= 500000) {
    score += 25;
    reasons.push("attraktives Volumen");
  } else if (value > 0) {
    score += 12;
    reasons.push("mittleres Volumen");
  } else {
    risks.push("Volumen unbekannt");
  }

  if (duration >= 24) {
    score += 20;
    reasons.push("lange Laufzeit");
  } else if (duration > 0) {
    score += 8;
    reasons.push("kürzere Laufzeit");
  }

  if (hit.trade && hit.trade !== "Sonstiges") {
    score += 15;
    reasons.push("Gewerk zuordenbar");
  } else {
    risks.push("Gewerk unklar");
  }

  let recommendation = "No-Go";
  if (score >= 75) recommendation = "Bid";
  else if (score >= 50) recommendation = "Prüfen";

  const nextStep =
    recommendation === "Bid"
      ? "In Tender-Liste übernehmen und Angebotsvorbereitung starten"
      : recommendation === "Prüfen"
        ? "Leistungsbild, Kapazität und Marge manuell prüfen"
        : "Vorerst beobachten oder verwerfen";

  return {
    recommendation,
    score,
    reasoning: reasons,
    risks,
    nextStep,
    summary:
      recommendation === "Bid"
        ? "Treffer passt grundsätzlich gut zu Radius, Gewerk und wirtschaftlicher Attraktivität."
        : recommendation === "Prüfen"
          ? "Treffer ist potenziell interessant, braucht aber manuelle Prüfung."
          : "Treffer ist aktuell nicht priorisiert."
  };
}

export async function analyzeHitWithAI(hit: any, context: any) {
  const prompt = `
Du bist ein B2B-Ausschreibungsanalyst für RUWE.

Bewerte den folgenden Treffer nur im JSON-Format.

Ziel:
- recommendation: "Bid" | "Prüfen" | "No-Go"
- score: Zahl 0-100
- summary: kurze Management-Zusammenfassung
- reasoning: Array kurzer Gründe
- risks: Array kurzer Risiken
- nextStep: ein konkreter nächster Schritt

Kontext:
${JSON.stringify(context, null, 2)}

Treffer:
${JSON.stringify(hit, null, 2)}

Antworte exakt als JSON:
{
  "recommendation": "Bid",
  "score": 82,
  "summary": "...",
  "reasoning": ["...", "..."],
  "risks": ["...", "..."],
  "nextStep": "..."
}
`.trim();

  try {
    const result = await analyzeWithAvailableProvider(prompt);
    return {
      ...result.data,
      provider: result.provider
    };
  } catch {
    return {
      ...fallbackAnalysis(hit),
      provider: "fallback-heuristic"
    };
  }
}
TS

echo "🧠 AI Workflow ..."
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
TS

echo "🔌 Analyze API ..."
cat > app/api/ops/analyze-hits/route.ts <<'TS'
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
TS

echo "📊 AI Results Seite ..."
cat > app/dashboard/ai-results/page.tsx <<'TSX'
import { readStore } from "@/lib/storage";

export default async function AiResultsPage() {
  const db = await readStore();
  const hits = db.sourceHits || [];
  const analyzed = hits.filter((x: any) => x.aiRecommendation);

  return (
    <div className="stack">
      <div>
        <h1 className="h1">AI Ergebnisse</h1>
        <p className="sub">Empfehlungen, Begründungen und nächste Schritte für die aktuelle Trefferlage.</p>
      </div>

      <div className="card table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Titel</th>
              <th>Empfehlung</th>
              <th>Score</th>
              <th>Zusammenfassung</th>
              <th>Nächster Schritt</th>
              <th>Provider</th>
            </tr>
          </thead>
          <tbody>
            {analyzed.map((x: any) => (
              <tr key={x.id}>
                <td>{x.title}</td>
                <td>{x.aiRecommendation}</td>
                <td>{x.aiScore || 0}</td>
                <td>{x.aiSummary || "-"}</td>
                <td>{x.aiNextStep || "-"}</td>
                <td>{x.aiProvider || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
TSX

echo "📊 Dashboard-Buttons ergänzen ..."
python3 - <<'PY'
from pathlib import Path
p = Path("app/page.tsx")
text = p.read_text()

text = text.replace(
    '            <Link className="button" href="/api/ops/live-ingest?redirect=1">Abruf starten</Link>\n            <Link className="button-secondary" href="/dashboard/smoke">Smoke</Link>\n            <Link className="button-secondary" href="/dashboard/ai-smoke">AI Test</Link>',
    '            <Link className="button" href="/api/ops/live-ingest?redirect=1">Abruf starten</Link>\n            <Link className="button-secondary" href="/api/ops/analyze-hits?redirect=1">AI Analyse</Link>\n            <Link className="button-secondary" href="/dashboard/smoke">Smoke</Link>\n            <Link className="button-secondary" href="/dashboard/ai-smoke">AI Test</Link>'
)

p.write_text(text)
PY

echo "📄 Pipeline modern ergänzen ..."
cat > app/pipeline/page.tsx <<'TSX'
import { readStore } from "@/lib/storage";

function grouped(rows: any[]) {
  const stages = ["Qualifiziert", "Review", "Freigabe intern", "Angebot", "Beobachtet", "Eingereicht", "Verhandlung", "Gewonnen", "Verloren"];
  return stages.map((stage) => ({
    stage,
    items: rows.filter((x) => x.stage === stage)
  })).filter((x) => x.items.length > 0);
}

export default async function PipelinePage() {
  const db = await readStore();
  const rows = db.pipeline || [];
  const groups = grouped(rows);

  return (
    <div className="stack">
      <div>
        <h1 className="h1">Pipeline</h1>
        <p className="sub">Operative Übersicht über Chancen, Stages, nächste Schritte und die Pflege bis Ende der Woche.</p>
      </div>

      <div className="grid grid-4">
        <div className="card"><div className="label">Chancen</div><div className="kpi">{rows.length}</div></div>
        <div className="card"><div className="label">A-Priorität</div><div className="kpi">{rows.filter((x: any) => x.priority === "A").length}</div></div>
        <div className="card"><div className="label">Im Review</div><div className="kpi">{rows.filter((x: any) => x.stage === "Review").length}</div></div>
        <div className="card"><div className="label">Wert gesamt</div><div className="kpi">{Math.round(rows.reduce((sum: number, x: any) => sum + (x.value || 0), 0) / 1000)}k €</div></div>
      </div>

      {groups.map((group) => (
        <div className="card" key={group.stage}>
          <div className="section-title">{group.stage}</div>
          <div className="table-wrap" style={{ marginTop: 12 }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Titel</th>
                  <th>Priorität</th>
                  <th>Wert</th>
                  <th>Nächster Schritt</th>
                  <th>EOW</th>
                  <th>AI Score</th>
                </tr>
              </thead>
              <tbody>
                {group.items.map((item: any) => (
                  <tr key={item.id}>
                    <td>{item.title}</td>
                    <td>{item.priority || "-"}</td>
                    <td>{Math.round((item.value || 0) / 1000)}k €</td>
                    <td>{item.nextStep || "-"}</td>
                    <td>{item.eowUpdate || "-"}</td>
                    <td>{item.aiScore || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}
TSX

npm run build || true
git add .
git commit -m "feat: add live-to-ai analysis flow with provider fallback and pipeline/tender generation" || true
git push origin main || true

echo "✅ Live + AI Upgrade eingebaut."
