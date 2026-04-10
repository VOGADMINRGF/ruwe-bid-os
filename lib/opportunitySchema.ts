import { toPlain } from "@/lib/serializers";
import { normalizeRegionFromHit } from "@/lib/regionNormalization";
import { classifyOpportunity } from "@/lib/tradeClassification";

function n(v: any) {
  const x = Number(v || 0);
  return Number.isFinite(x) ? x : 0;
}

export function buildOpportunityFromHit(hit: any) {
  const classified = classifyOpportunity(hit);
  const region = normalizeRegionFromHit(hit);

  return toPlain({
    id: `opp_${String(hit.id || Math.random().toString(36).slice(2, 10))}`,
    sourceHitId: String(hit.id || ""),
    title: String(hit.title || ""),
    sourceId: String(hit.sourceId || ""),
    region,
    regionRaw: String(hit.region || hit.city || ""),
    trade: classified.trade,
    dueDate: hit.dueDate || null,
    durationMonths: n(hit.durationMonths),
    estimatedValue: n(hit.estimatedValue),
    directLinkValid: hit.directLinkValid === true,
    externalResolvedUrl: typeof hit.externalResolvedUrl === "string" ? hit.externalResolvedUrl : null,
    decision: String(hit.aiRecommendation || hit.aiDecision || "Unklar"),
    calcMode: classified.calcMode,
    complexity: "normal",
    hoursDerivable: classified.calcMode === "Stunden" || classified.calcMode === "Turnus",
    daysDerivable: false,
    areaDerivable: classified.calcMode === "Fläche",
    extractedSpecs: toPlain(hit.extractedSpecs || {}),
    understandingSignals: {},
    missingVariableCount: 0,
    ownerId: null,
    supportOwnerId: null,
    stage: "neu",
    nextQuestion: null,
    operationallyUsable: hit.operationallyUsable !== false
  });
}
