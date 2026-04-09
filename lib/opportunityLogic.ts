import { readStore, replaceCollection } from "@/lib/storage";

function n(v: any) {
  const x = Number(v || 0);
  return Number.isFinite(x) ? x : 0;
}

export function nextId(prefix = "opp") {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function derivePriority(hit: any) {
  const volume = n(hit?.estimatedValue);
  const duration = n(hit?.durationMonths);
  const usable = hit?.operationallyUsable !== false;
  const ai = String(hit?.aiRecommendation || "").toLowerCase();

  if (!usable) return "C";
  if (ai === "bid" && volume >= 500000) return "A";
  if (ai === "bid") return "B";
  if (ai === "prüfen" || ai === "pruefen") return duration >= 24 ? "B" : "C";
  return "C";
}

export function deriveDefaultStage(hit: any) {
  const ai = String(hit?.aiRecommendation || "").toLowerCase();
  if (ai === "bid") return "Qualifiziert";
  if (ai === "prüfen" || ai === "pruefen") return "Review";
  return "No-Bid";
}

export function deriveNextStep(hit: any) {
  const ai = String(hit?.aiRecommendation || "").toLowerCase();
  if (hit?.operationallyUsable === false) return "Quellenlink und Vergabezugang klären";
  if (!hit?.estimatedValue || Number(hit?.estimatedValue) <= 0) return "Volumen plausibilisieren";
  if (ai === "bid") return "Angebotschance prüfen und Unterlagen öffnen";
  if (ai === "prüfen" || ai === "pruefen") return "Manuelle Fachprüfung durchführen";
  return "Nicht priorisieren oder nur beobachten";
}

export async function listOpportunities() {
  const db = await readStore();
  return Array.isArray(db.opportunities) ? db.opportunities : [];
}

export async function upsertOpportunityFromHit(hitId: string) {
  const db = await readStore();
  const hits = Array.isArray(db.sourceHits) ? db.sourceHits : [];
  const current = Array.isArray(db.opportunities) ? db.opportunities : [];
  const hit = hits.find((x: any) => x.id === hitId);

  if (!hit) throw new Error("Treffer nicht gefunden");

  const existing = current.find((x: any) => x.sourceHitId === hitId);
  const base = {
    title: hit.title || "Unbenannter Treffer",
    sourceHitId: hit.id,
    region: hit.region || "Unbekannt",
    trade: hit.trade || "Unbekannt",
    estimatedValue: n(hit.estimatedValue),
    durationMonths: n(hit.durationMonths),
    aiRecommendation: hit.aiRecommendation || null,
    aiReason: hit.aiReason || null,
    aiConfidence: hit.aiConfidence ?? null,
    externalResolvedUrl: hit.externalResolvedUrl || null,
    directLinkValid: !!hit.directLinkValid,
    operationallyUsable: hit.operationallyUsable !== false,
    priority: derivePriority(hit),
    stage: deriveDefaultStage(hit),
    nextStep: deriveNextStep(hit),
    dueDate: hit.dueDate || null,
    ownerId: null,
    manualDecision: null,
    manualReason: "",
    status: "open",
    updatedAt: new Date().toISOString()
  };

  if (existing) {
    const next = current.map((x: any) =>
      x.id === existing.id
        ? {
            ...x,
            ...base,
            ownerId: x.ownerId ?? null,
            manualDecision: x.manualDecision ?? null,
            manualReason: x.manualReason ?? "",
            stage: x.stage || base.stage,
            nextStep: x.nextStep || base.nextStep
          }
        : x
    );
    await replaceCollection("opportunities" as any, next);
    return next.find((x: any) => x.id === existing.id);
  }

  const created = {
    id: nextId(),
    ...base,
    createdAt: new Date().toISOString()
  };

  await replaceCollection("opportunities" as any, [...current, created]);
  return created;
}
