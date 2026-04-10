type Decision = "Bid" | "Prüfen" | "No-Go";

type ProviderResult = {
  ok: boolean;
  provider: string;
  decision?: Decision;
  confidence?: number;
  reason?: string;
  raw?: any;
  error?: string;
};

function n(v: any) {
  const x = Number(v || 0);
  return Number.isFinite(x) ? x : 0;
}

function extractJson(text: string) {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    return JSON.parse(match[0]);
  } catch {
    return null;
  }
}

function normalizeDecision(v: any): Decision {
  const x = String(v || "").trim().toLowerCase();
  if (["bid", "go", "empfohlen", "recommended"].includes(x)) return "Bid";
  if (["prüfen", "pruefen", "review", "manual_review", "manual review"].includes(x)) return "Prüfen";
  return "No-Go";
}

function normalizeConfidence(v: any) {
  const x = Number(v);
  if (!Number.isFinite(x)) return 0.5;
  if (x > 1) return Math.max(0, Math.min(1, x / 100));
  return Math.max(0, Math.min(1, x));
}

function heuristicDecision(hit: any): { decision: Decision; reason: string; confidence: number } {
  const trade = String(hit?.trade || "").toLowerCase();
  const title = String(hit?.title || "").toLowerCase();
  const matchedSite = !!hit?.matchedSiteId;
  const volume = n(hit?.estimatedValue);
  const duration = n(hit?.durationMonths);
  const distance = n(hit?.distanceKm || 999);

  const facilityTerms = ["reinigung", "glasreinigung", "unterhaltsreinigung", "hausmeister", "winterdienst", "grünpflege", "gruenpflege", "sicherheit"];
  const tradeFit = facilityTerms.some((t) => trade.includes(t) || title.includes(t));

  if (!matchedSite && !tradeFit) {
    return { decision: "No-Go", reason: "Kein belastbarer Standort- oder Geschäftsfeldfit.", confidence: 0.88 };
  }

  if (matchedSite && tradeFit && distance <= 35 && volume >= 200000) {
    return { decision: "Bid", reason: "Guter Standortfit, passendes Geschäftsfeld und attraktives Volumen.", confidence: 0.84 };
  }

  if (matchedSite && tradeFit) {
    if (duration >= 24 || volume >= 100000) {
      return { decision: "Prüfen", reason: "Grundsätzlich passend, aber fachlich/operativ manuell prüfen.", confidence: 0.67 };
    }
  }

  return { decision: "No-Go", reason: "Aktuell kein ausreichend attraktiver Fit.", confidence: 0.7 };
}

function shouldEscalate(hit: any, primary: ProviderResult) {
  const volume = n(hit?.estimatedValue);
  const duration = n(hit?.durationMonths);
  const distance = n(hit?.distanceKm || 999);
  const conf = primary.confidence ?? 0;

  if (!primary.ok) return true;
  if (conf < 0.72) return true;
  if (primary.decision === "Prüfen") return true;
  if (volume >= 500000) return true;
  if (duration >= 24) return true;
  if (distance <= 15 && primary.decision === "No-Go") return true;

  return false;
}

function secondaryLooksUnreliable(secondary: ProviderResult) {
  const reason = String(secondary.reason || "").trim();
  const confidence = secondary.confidence ?? 0;
  return !reason || reason.length < 18 || confidence <= 0.55;
}

function buildPrompt(hit: any, mode: "primary" | "second") {
  return `
Du analysierst öffentliche Ausschreibungen für ein Bid-OS von RUWE.

Ziel:
- entscheide zwischen genau drei Werten: "Bid", "Prüfen", "No-Go"
- gib eine kurze deutsche Begründung
- gib confidence zwischen 0 und 1

Wichtige Leitplanken:
- RUWE-relevant sind besonders: Reinigung, Glasreinigung, Hausmeisterdienste, Winterdienst, Sicherheitsdienste, Grünpflege / Garten- und Landschaftspflege
- "Bid" nur wenn realistisch sinnvoll
- "Prüfen" bei Grenzfällen
- "No-Go" bei fachlich unpassenden oder unattraktiven Fällen

${mode === "second" ? "Du bist die Zweitmeinung. Prüfe kritisch, ob die erste Einschätzung belastbar ist." : "Du bist die erste Kurzentscheidung."}

Antworte nur als JSON:
{
  "decision": "Bid|Prüfen|No-Go",
  "confidence": 0.0,
  "reason": "..."
}

Hit:
${JSON.stringify({
  id: hit?.id,
  title: hit?.title,
  region: hit?.region,
  trade: hit?.trade,
  sourceName: hit?.sourceName,
  matchedSiteId: hit?.matchedSiteId,
  postalCode: hit?.postalCode,
  distanceKm: hit?.distanceKm,
  estimatedValue: hit?.estimatedValue,
  durationMonths: hit?.durationMonths,
  status: hit?.status
}, null, 2)}
`.trim();
}

async function fetchWithTimeout(url: string, init: any, timeoutMs = 45000) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...init, signal: controller.signal });
    return res;
  } finally {
    clearTimeout(t);
  }
}

export async function analyzeWithOpenAI(hit: any, model: string): Promise<ProviderResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return { ok: false, provider: `openai:${model}`, error: "missing_openai_key" };

  try {
    console.log("[AI] OpenAI request start", { model, hitId: hit?.id });

    const res = await fetchWithTimeout("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        input: buildPrompt(hit, "primary")
      })
    }, 35000);

    const data = await res.json();
    const text =
      data?.output_text ||
      data?.output?.map((x: any) => x?.content?.map((c: any) => c?.text).join("")).join("\n") ||
      JSON.stringify(data);

    const parsed = extractJson(text);
    if (!parsed) {
      return { ok: false, provider: `openai:${model}`, error: "openai_parse_failed", raw: data };
    }

    console.log("[AI] OpenAI request done", { hitId: hit?.id });

    return {
      ok: true,
      provider: `openai:${model}`,
      decision: normalizeDecision(parsed.decision),
      confidence: normalizeConfidence(parsed.confidence),
      reason: String(parsed.reason || ""),
      raw: parsed
    };
  } catch (error: any) {
    console.log("[AI] OpenAI failed:", error?.message || String(error));
    return { ok: false, provider: `openai:${model}`, error: error?.message || "openai_failed" };
  }
}

export async function analyzeWithAnthropic(hit: any, model: string, primaryDecision?: ProviderResult): Promise<ProviderResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return { ok: false, provider: `anthropic:${model}`, error: "missing_anthropic_key" };

  try {
    console.log("[AI] Anthropic request start", { model, hitId: hit?.id });

    const prompt = buildPrompt({
      ...hit,
      primaryDecision: primaryDecision?.decision,
      primaryReason: primaryDecision?.reason,
      primaryConfidence: primaryDecision?.confidence
    }, "second");

    const res = await fetchWithTimeout("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model,
        max_tokens: 500,
        messages: [
          { role: "user", content: prompt }
        ]
      })
    }, 45000);

    const data = await res.json();
    const text =
      data?.content?.map((x: any) => x?.text).join("\n") ||
      JSON.stringify(data);

    const parsed = extractJson(text);
    if (!parsed) {
      return { ok: false, provider: `anthropic:${model}`, error: "anthropic_parse_failed", raw: data };
    }

    console.log("[AI] Anthropic request done", { hitId: hit?.id });

    return {
      ok: true,
      provider: `anthropic:${model}`,
      decision: normalizeDecision(parsed.decision),
      confidence: normalizeConfidence(parsed.confidence),
      reason: String(parsed.reason || ""),
      raw: parsed
    };
  } catch (error: any) {
    console.log("[AI] Anthropic failed:", error?.message || String(error));
    return { ok: false, provider: `anthropic:${model}`, error: error?.message || "anthropic_failed" };
  }
}

export async function orchestrateHitAnalysis(hit: any) {
  const openaiModel = process.env.OPENAI_MODEL || "gpt-5";
  const anthropicModel = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-5";

  console.log("[AI] Analyze hit start", { id: hit?.id, title: hit?.title });
  console.log("[AI] Providers", {
    openai: !!process.env.OPENAI_API_KEY,
    anthropic: !!process.env.ANTHROPIC_API_KEY
  });

  const primary = await analyzeWithOpenAI(hit, openaiModel);

  let secondary: ProviderResult | null = null;
  let finalDecision: Decision;
  let finalReason: string;
  let finalConfidence: number;
  let finalProvider: string;

  if (shouldEscalate(hit, primary) && process.env.ANTHROPIC_API_KEY) {
    secondary = await analyzeWithAnthropic(hit, anthropicModel, primary);

    if (secondary.ok) {
      const preferPrimary =
        primary.ok &&
        (
          secondaryLooksUnreliable(secondary) ||
          (
            primary.decision === "Bid" &&
            secondary.decision === "No-Go" &&
            (primary.confidence ?? 0) >= 0.75
          )
        );

      if (preferPrimary) {
        finalDecision = primary.decision!;
        finalReason = primary.reason || secondary.reason || "";
        finalConfidence = primary.confidence ?? secondary.confidence ?? 0.5;
        finalProvider = primary.provider;
      } else {
        finalDecision = secondary.decision!;
        finalReason = secondary.reason || primary.reason || "";
        finalConfidence = secondary.confidence ?? primary.confidence ?? 0.5;
        finalProvider = `${primary.ok ? primary.provider : "openai_failed"}+${secondary.provider}`;
      }
    } else if (primary.ok) {
      finalDecision = primary.decision!;
      finalReason = primary.reason || "";
      finalConfidence = primary.confidence ?? 0.5;
      finalProvider = primary.provider;
    } else {
      const h = heuristicDecision(hit);
      finalDecision = h.decision;
      finalReason = h.reason;
      finalConfidence = h.confidence;
      finalProvider = "fallback-heuristic";
    }
  } else if (primary.ok) {
    finalDecision = primary.decision!;
    finalReason = primary.reason || "";
    finalConfidence = primary.confidence ?? 0.5;
    finalProvider = primary.provider;
  } else {
    const h = heuristicDecision(hit);
    finalDecision = h.decision;
    finalReason = h.reason;
    finalConfidence = h.confidence;
    finalProvider = "fallback-heuristic";
  }

  console.log("[AI] Analyze hit done", {
    id: hit?.id,
    recommendation: finalDecision,
    provider: finalProvider,
    confidence: finalConfidence
  });

  return {
    aiRecommendation: finalDecision,
    aiReason: finalReason,
    aiConfidence: finalConfidence,
    aiProvider: finalProvider,
    aiPrimaryProvider: primary.provider,
    aiPrimaryDecision: primary.ok ? primary.decision : null,
    aiPrimaryConfidence: primary.ok ? primary.confidence : null,
    aiPrimaryReason: primary.ok ? primary.reason : null,
    aiSecondaryProvider: secondary?.provider || null,
    aiSecondaryDecision: secondary?.ok ? secondary.decision : null,
    aiSecondaryConfidence: secondary?.ok ? secondary.confidence : null,
    aiSecondaryReason: secondary?.ok ? secondary.reason : null,
    aiAnalysisStatus: "done",
    aiAnalyzedAt: new Date().toISOString()
  };
}
