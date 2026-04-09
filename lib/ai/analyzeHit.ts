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
