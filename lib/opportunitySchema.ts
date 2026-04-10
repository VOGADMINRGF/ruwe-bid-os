import { toPlain } from "@/lib/serializers";

function n(v: any) {
  const x = Number(v || 0);
  return Number.isFinite(x) ? x : 0;
}

function normalizeTrade(hit: any): string {
  const raw = String(hit?.trade || "").trim();
  if (raw) return raw;
  const t = String(hit?.title || "").toLowerCase();
  if (t.includes("glas")) return "Glasreinigung";
  if (t.includes("winter")) return "Winterdienst";
  if (t.includes("hausmeister") || t.includes("hauswart")) return "Hausmeister";
  if (t.includes("sicherheit") || t.includes("objektschutz") || t.includes("wach")) return "Sicherheit";
  if (t.includes("grün") || t.includes("garten") || t.includes("landschaft")) return "Grünpflege";
  if (t.includes("reinigung")) return "Reinigung";
  return "Sonstiges";
}

function normalizeRegion(hit: any): string {
  const txt = `${hit?.region || ""} ${hit?.city || ""} ${hit?.title || ""}`.toLowerCase();
  if (txt.includes("berlin")) return "Berlin";
  if (txt.includes("magdeburg")) return "Magdeburg";
  if (txt.includes("schkeuditz") || txt.includes("leipzig")) return "Schkeuditz / Leipzig";
  if (txt.includes("zeitz")) return "Zeitz";
  if (txt.includes("potsdam") || txt.includes("stahnsdorf")) return "Potsdam / Stahnsdorf";
  if (txt.includes("brandenburg")) return "Brandenburg";
  if (txt.includes("online")) return "Online";
  return String(hit?.region || hit?.city || "Sonstige");
}

function detectUnitSignals(text: string) {
  const s = text.toLowerCase();
  return {
    hasHours: /\b(stunden|std\.?|hours?)\b/.test(s),
    hasDays: /\b(tage|werktage|days?)\b/.test(s),
    hasMonths: /\b(monate|monat|months?)\b/.test(s),
    hasYears: /\b(jahre|jahr|years?)\b/.test(s),
    hasArea: /\b(m²|qm|quadratmeter)\b/.test(s),
    hasObjects: /\b(objekte|standorte|liegenschaften|gebäude)\b/.test(s),
    hasFrequency: /\b(täglich|wöchentlich|monatlich|turnus|intervall|pro woche|pro monat)\b/.test(s),
    hasLoses: /\b(los|lose)\b/.test(s),
    hasReadiness: /\b(rufbereitschaft|bereitschaft)\b/.test(s),
    hasWinter: /\b(schnee|glätte|winterdienst)\b/.test(s)
  };
}

function inferCalcMode(signals: ReturnType<typeof detectUnitSignals>) {
  if (signals.hasHours) return "stundenmodell";
  if (signals.hasArea) return "flächenmodell";
  if (signals.hasObjects && signals.hasFrequency) return "turnusmodell";
  return "unklar";
}

function estimateUnderstanding(hit: any) {
  const text = `${hit?.title || ""} ${hit?.aiSummary || ""} ${hit?.aiReason || ""} ${hit?.aiPrimaryReason || ""} ${hit?.url || ""}`;
  const signals = detectUnitSignals(text);
  return {
    signals,
    calcMode: inferCalcMode(signals),
    hoursDerivable: signals.hasHours || (signals.hasObjects && signals.hasFrequency),
    daysDerivable: signals.hasDays,
    areaDerivable: signals.hasArea,
    complexity: signals.hasReadiness || signals.hasWinter ? "hoch" : signals.hasObjects ? "mittel" : "normal"
  };
}

export function buildOpportunityFromHit(hit: any) {
  const understanding = estimateUnderstanding(hit);
  const trade = normalizeTrade(hit);
  const region = normalizeRegion(hit);

  return toPlain({
    id: `opp_${hit.id || Math.random().toString(36).slice(2, 10)}`,
    sourceHitId: String(hit.id || ""),
    title: String(hit.title || ""),
    sourceId: String(hit.sourceId || ""),
    region,
    trade,
    dueDate: hit.dueDate || null,
    durationMonths: n(hit.durationMonths),
    estimatedValue: n(hit.estimatedValue),
    directLinkValid: hit.directLinkValid === true,
    externalResolvedUrl: typeof hit.externalResolvedUrl === "string" ? hit.externalResolvedUrl : null,
    decision: String(hit.aiRecommendation || hit.aiDecision || "Unklar"),
    calcMode: understanding.calcMode,
    complexity: understanding.complexity,
    hoursDerivable: understanding.hoursDerivable,
    daysDerivable: understanding.daysDerivable,
    areaDerivable: understanding.areaDerivable,
    extractedSpecs: toPlain(hit.extractedSpecs || {}),
    understandingSignals: toPlain(understanding.signals),
    missingVariableCount: 0,
    ownerId: null,
    supportOwnerId: null,
    stage: "neu",
    nextQuestion: null,
    operationallyUsable: hit.operationallyUsable !== false
  });
}
