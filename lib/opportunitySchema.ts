import { toPlain } from "@/lib/serializers";
import { normalizeRegionFromHit } from "@/lib/regionNormalization";
import { classifyOpportunity } from "@/lib/tradeClassification";

const CORE_REGIONS = [
  "Berlin",
  "Magdeburg",
  "Potsdam / Stahnsdorf",
  "Leipzig / Schkeuditz",
  "Zeitz",
  "Brandenburg",
  "Sachsen-Anhalt",
  "Thüringen",
  "Online"
];

const CORE_TRADES = [
  "Reinigung",
  "Glasreinigung",
  "Hausmeister",
  "Sicherheit",
  "Grünpflege",
  "Winterdienst"
];

function n(v: any) {
  const x = Number(v || 0);
  return Number.isFinite(x) ? x : 0;
}

function normalizeAiDecision(value: any) {
  const v = String(value || "").toLowerCase();
  if (v === "bid" || v === "go") return "Bid";
  if (v === "prüfen" || v === "pruefen" || v === "review" || v === "manual_review") return "Prüfen";
  if (v === "no-bid" || v === "nobid") return "No-Bid";
  if (v === "no-go" || v === "nogo" || v === "observed") return "No-Go";
  return "Prüfen";
}

function formatNoBidReason(input: {
  mode: "No-Bid" | "No-Go";
  region: string;
  trade: string;
  directLinkValid: boolean;
  coreRegion: boolean;
  coreTrade: boolean;
}) {
  const first =
    input.mode === "No-Go"
      ? "Der Fall liegt aktuell außerhalb der belastbaren operativen Zielpassung."
      : "Der Fall bleibt vorerst außerhalb der aktiven Angebotspriorisierung.";

  const secondParts = [
    input.directLinkValid ? "Direktlink ist belastbar." : "Direktlink ist nicht belastbar.",
    input.coreRegion ? `Region ${input.region} ist grundsätzlich relevant.` : `Region ${input.region || "unbekannt"} liegt außerhalb des Kernraums.`,
    input.coreTrade ? `Gewerk ${input.trade} ist grundsätzlich im Zielbild.` : `Gewerk ${input.trade || "unbekannt"} ist derzeit nicht im Kernfokus.`
  ];

  return `${first} ${secondParts.join(" ")}`;
}

function computeFitScore(input: {
  coreRegion: boolean;
  coreTrade: boolean;
  directLinkValid: boolean;
  estimatedValue: number;
  dueDate: string | null;
  calcMode: string;
  aiDecision: string;
}) {
  let score = 30;
  if (input.coreRegion) score += 20;
  if (input.coreTrade) score += 20;
  if (input.directLinkValid) score += 15;
  if (input.estimatedValue > 0) score += 8;
  if (input.dueDate) score += 4;
  if (input.calcMode && input.calcMode !== "unklar") score += 6;
  if (input.aiDecision === "Bid") score += 8;
  if (input.aiDecision === "No-Go" || input.aiDecision === "No-Bid") score -= 8;
  return Math.max(0, Math.min(100, score));
}

function deriveDecision(input: {
  aiDecision: string;
  directLinkValid: boolean;
  coreRegion: boolean;
  coreTrade: boolean;
  estimatedValue: number;
}) {
  if (!input.directLinkValid) return "No-Bid";

  if (input.aiDecision === "Bid") {
    if (input.coreRegion && input.coreTrade) return "Bid";
    return "Prüfen";
  }

  if (input.aiDecision === "Prüfen") return "Prüfen";

  if (input.aiDecision === "No-Go" || input.aiDecision === "No-Bid") {
    if (input.coreRegion && input.coreTrade) return "Prüfen";
    if (!input.coreTrade) return "No-Go";
    return "No-Bid";
  }

  if (input.estimatedValue > 0 && input.coreRegion && input.coreTrade) return "Prüfen";
  return "No-Bid";
}

function fitBucketByDecision(decision: string, score: number) {
  if (decision === "Bid" && score >= 70) return "Fit";
  if (decision === "No-Bid" || decision === "No-Go" || score < 35) return "No-Fit";
  return "Prüfen";
}

function nextStepByDecision(decision: string, directLinkValid: boolean) {
  if (!directLinkValid) return "Direktlink manuell klären und Quelle erneut prüfen";
  if (decision === "Bid") return "Opportunity qualifizieren und Angebotsvorbereitung starten";
  if (decision === "Prüfen") return "Fachprüfung durchführen und fehlende Variablen beantworten";
  if (decision === "No-Bid") return "Im Review-Backlog halten und nur bei neuen Signalen neu bewerten";
  return "Nicht priorisieren, Entscheidung begründet dokumentieren";
}

export function buildOpportunityFromHit(hit: any) {
  const classified = classifyOpportunity(hit);
  const region = normalizeRegionFromHit(hit);
  const trade = classified.trade;
  const aiDecision = normalizeAiDecision(hit.aiRecommendation || hit.aiDecision);
  const directLinkValid = hit.directLinkValid === true;
  const estimatedValue = n(hit.estimatedValue);
  const coreRegion = CORE_REGIONS.includes(region);
  const coreTrade = CORE_TRADES.includes(trade);

  const decision = deriveDecision({
    aiDecision,
    directLinkValid,
    coreRegion,
    coreTrade,
    estimatedValue
  });

  const fitScore = computeFitScore({
    coreRegion,
    coreTrade,
    directLinkValid,
    estimatedValue,
    dueDate: hit.dueDate || null,
    calcMode: classified.calcMode,
    aiDecision
  });
  const fitBucket = fitBucketByDecision(decision, fitScore);

  const reasoningLead =
    decision === "Bid"
      ? "Der Fall passt regional, fachlich und über den Direktlink operativ in den aktiven Fokus."
      : decision === "Prüfen"
      ? "Der Fall ist grundsätzlich relevant, braucht aber eine fachliche Einordnung vor Angebotsstart."
      : decision === "No-Bid"
      ? formatNoBidReason({
          mode: "No-Bid",
          region,
          trade,
          directLinkValid,
          coreRegion,
          coreTrade
        })
      : formatNoBidReason({
          mode: "No-Go",
          region,
          trade,
          directLinkValid,
          coreRegion,
          coreTrade
        });

  const fitReasonList =
    decision === "Bid"
      ? [
          "Region und Gewerk liegen im operativen Zielraum.",
          directLinkValid ? "Direktlink ist belastbar und direkt nutzbar." : "Direktlink ist nicht belastbar."
        ]
      : decision === "Prüfen"
      ? [
          "Die AI-Einschätzung ist nicht ausreichend stabil für eine harte Ablehnung.",
          "Zur Freigabe fehlen noch belastbare Parameter oder manuelle Klärungen."
        ]
      : [
          directLinkValid ? "Der Direktlink ist vorhanden, jedoch reicht der Gesamtfit nicht aus." : "Der Direktlink ist unzureichend und blockiert operative Nutzbarkeit.",
          coreRegion || coreTrade ? "Ein Teilfit ist vorhanden, reicht aber derzeit nicht für aktive Priorisierung." : "Region und Gewerk liegen außerhalb des aktuellen Kernfokus."
        ];

  const noBidReason =
    decision === "No-Bid" || decision === "No-Go"
      ? reasoningLead
      : "";

  return toPlain({
    id: `opp_${String(hit.id || Math.random().toString(36).slice(2, 10))}`,
    sourceHitId: String(hit.id || ""),
    title: String(hit.title || ""),
    sourceId: String(hit.sourceId || ""),
    region,
    regionRaw: String(hit.regionRaw || hit.region || hit.city || ""),
    regionNormalized: region,
    trade,
    tradeRaw: String(hit.tradeRaw || hit.trade || ""),
    tradeNormalized: trade,
    buyer: hit.buyer || hit.vergabestelle || null,
    dueDate: hit.dueDate || null,
    durationMonths: n(hit.durationMonths),
    estimatedValue,
    lotInfo: hit.lotInfo || null,
    directLinkValid,
    directLinkReason: hit.directLinkReason || null,
    externalResolvedUrl: typeof hit.externalResolvedUrl === "string" ? hit.externalResolvedUrl : null,
    decision,
    fitScore,
    fitBucket,
    fitReasonShort: reasoningLead,
    fitReasonList,
    noBidReason,
    calcMode: classified.calcMode,
    complexity: "normal",
    hoursDerivable: classified.calcMode === "Stunden" || classified.calcMode === "Turnus",
    daysDerivable: false,
    areaDerivable: classified.calcMode === "Fläche",
    extractedSpecs: toPlain(hit.extractedSpecs || {}),
    understandingSignals: {
      coreRegion,
      coreTrade,
      aiDecision
    },
    missingVariableCount: 0,
    ownerId: null,
    supportOwnerId: null,
    stage:
      decision === "Bid"
        ? "qualifiziert"
        : decision === "Prüfen"
        ? "review"
        : "beobachten",
    nextQuestion: null,
    nextStep: nextStepByDecision(decision, directLinkValid),
    operationallyUsable: hit.operationallyUsable === true && directLinkValid,
    overrideReason: "",
    createdAt: hit.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });
}
