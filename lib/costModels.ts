import { readStore, replaceCollection } from "@/lib/storage";

function n(v: any) {
  const x = Number(v || 0);
  return Number.isFinite(x) ? x : 0;
}

export type CostModel = {
  id: string;
  region: string;
  trade: string;
  unit: "hour" | "sqm_month" | "object_month" | "flat";
  minRate: number;
  maxRate: number;
  defaultRate: number;
  source?: string;
  note?: string;
  status?: "active" | "draft";
};

export async function listCostModels() {
  const db = await readStore();
  return Array.isArray(db.costModels) ? db.costModels : [];
}

export async function listOpenCostGaps() {
  const db = await readStore();
  return Array.isArray(db.costGaps) ? db.costGaps : [];
}

export async function ensureCostCollections() {
  const db = await readStore();
  if (!Array.isArray(db.costModels)) {
    await replaceCollection("costModels" as any, []);
  }
  if (!Array.isArray(db.costGaps)) {
    await replaceCollection("costGaps" as any, []);
  }
}

export function findBestCostModel(models: CostModel[], region?: string, trade?: string) {
  const r = String(region || "").toLowerCase();
  const t = String(trade || "").toLowerCase();

  const exact = models.find((m) =>
    String(m.region || "").toLowerCase() === r &&
    String(m.trade || "").toLowerCase() === t &&
    m.status !== "draft"
  );
  if (exact) return exact;

  const byTrade = models.find((m) =>
    String(m.trade || "").toLowerCase() === t &&
    m.status !== "draft"
  );
  if (byTrade) return byTrade;

  return null;
}

export async function rememberMissingParameter(hit: any, missingField: string, note?: string) {
  const db = await readStore();
  const current = Array.isArray(db.costGaps) ? db.costGaps : [];

  const row = {
    id: `gap_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    hitId: hit?.id || null,
    region: hit?.region || "Unbekannt",
    trade: hit?.trade || "Unbekannt",
    missingField,
    note: note || "",
    status: "open",
    createdAt: new Date().toISOString()
  };

  await replaceCollection("costGaps" as any, [...current, row]);
  return row;
}

export function estimateVolumeByCostModel(hit: any, model: CostModel | null) {
  const duration = Math.max(1, n(hit?.durationMonths) || 12);

  if (!model) {
    return {
      estimatedValue: 0,
      estimationStatus: "missing_cost_model",
      estimationNote: "Kein passendes Kostenmodell vorhanden."
    };
  }

  const title = String(hit?.title || "").toLowerCase();
  const desc = String(hit?.description || "").toLowerCase();
  const text = `${title} ${desc}`;

  let multiplier = 1;

  if (model.unit === "object_month") {
    multiplier = duration;
  } else if (model.unit === "sqm_month") {
    const sqmMatch = text.match(/(\d{2,6})\s*(m²|qm|m2)/i);
    const sqm = sqmMatch ? n(sqmMatch[1]) : 1500;
    multiplier = sqm * duration;
  } else if (model.unit === "hour") {
    const hourMatch = text.match(/(\d{2,5})\s*(stunden|std\.)/i);
    const hours = hourMatch ? n(hourMatch[1]) : 160 * duration;
    multiplier = hours;
  } else {
    multiplier = 1;
  }

  const value = Math.round(multiplier * n(model.defaultRate));

  return {
    estimatedValue: value,
    estimationStatus: "estimated_from_cost_model",
    estimationNote: `${model.trade} · ${model.region} · ${model.unit} mit Standardrate ${model.defaultRate}`,
    costModelId: model.id
  };
}
