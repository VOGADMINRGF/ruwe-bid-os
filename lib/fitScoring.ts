import { readStore } from "@/lib/storage";
import { toPlain } from "@/lib/serializers";

function n(v: any) {
  const x = Number(v || 0);
  return Number.isFinite(x) ? x : 0;
}

const CORE_REGIONS = [
  "Berlin",
  "Magdeburg",
  "Potsdam / Stahnsdorf",
  "Leipzig / Schkeuditz",
  "Zeitz",
  "Brandenburg",
  "Sachsen-Anhalt",
  "Thüringen"
];

export async function scoreOpportunityFit(opportunity: any) {
  const db = await readStore();
  const rules = Array.isArray(db.siteTradeRules) ? db.siteTradeRules : [];
  const learningRules = Array.isArray((db as any).learningRules) ? (db as any).learningRules : [];

  let score = 0;
  const reasons: string[] = [];

  const region = String(opportunity?.region || "");
  const trade = String(opportunity?.trade || "");
  const decision = String(opportunity?.decision || "");

  const matchingRules = rules.filter((x: any) =>
    x?.enabled !== false &&
    String(x?.trade || "") === trade
  );

  if (CORE_REGIONS.includes(region)) {
    score += 20;
    reasons.push(`Region ${region} liegt im relevanten Zielraum.`);
  } else {
    score -= 35;
    reasons.push(`Region ${region || "unbekannt"} liegt aktuell außerhalb des primären Fokusraums.`);
  }

  if (matchingRules.length > 0) {
    score += 25;
    reasons.push(`Für ${trade} existiert bereits aktive Standort-/Gewerkelogik.`);
  } else {
    score -= 20;
    reasons.push(`Für ${trade} ist derzeit keine belastbare Betriebslogik hinterlegt.`);
  }

  if (opportunity?.directLinkValid === true) {
    score += 10;
  } else {
    score -= 10;
    reasons.push("Es fehlt ein belastbarer Direktlink.");
  }

  if (n(opportunity?.estimatedValue) > 0) {
    score += 10;
  } else {
    score -= 8;
    reasons.push("Das Volumen ist derzeit nicht belastbar kalkulierbar.");
  }

  if (opportunity?.calcMode && opportunity.calcMode !== "unklar") {
    score += 10;
  } else {
    score -= 10;
    reasons.push("Der Kalkulationsmodus ist noch unklar.");
  }

  if (decision === "Bid") score += 15;
  if (decision === "Prüfen") score += 5;
  if (decision === "No-Go" || decision === "No-Bid") score -= 5;

  const similarLearning = learningRules.filter((x: any) =>
    (x?.trade ? x.trade === trade : true) &&
    (x?.region ? x.region === region : true)
  );

  if (similarLearning.some((x: any) => x?.action === "promote_bid")) {
    score += 20;
    reasons.push("Eine gespeicherte Lernregel spricht für Freigabe ähnlicher Fälle.");
  }

  if (similarLearning.some((x: any) => x?.action === "demote_no_bid")) {
    score -= 20;
    reasons.push("Eine gespeicherte Lernregel spricht gegen ähnliche Fälle.");
  }

  const normalizedScore = Math.max(0, Math.min(100, score + 50));

  let bucket = "Prüfen";
  if (normalizedScore >= 70) bucket = "Fit";
  else if (normalizedScore < 35) bucket = "No-Fit";

  return toPlain({
    score: normalizedScore,
    bucket,
    shortReason:
      bucket === "Fit"
        ? "Passt regional und operativ grundsätzlich gut ins aktuelle Such- und Angebotsbild."
        : bucket === "No-Fit"
        ? "Fällt derzeit aus Fokusraum, Betriebslogik oder Kalkulationsqualität heraus."
        : "Ist nicht ausgeschlossen, braucht aber noch operative oder kalkulatorische Klärung.",
    detailedReasons: reasons.slice(0, 5)
  });
}
