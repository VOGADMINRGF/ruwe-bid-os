import { readStore, replaceCollection } from "@/lib/storage";

function nextId(prefix = "pm") {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export async function listParameterRows() {
  const db = await readStore();
  return Array.isArray(db.parameterMemory) ? db.parameterMemory : [];
}

export async function getParameterRow(id: string) {
  const rows = await listParameterRows();
  return rows.find((x: any) => x.id === id) || null;
}

export async function updateParameterRow(id: string, patch: Record<string, any>) {
  const db = await readStore();
  const rows = Array.isArray(db.parameterMemory) ? db.parameterMemory : [];
  const next = rows.map((x: any) =>
    x.id === id
      ? {
          ...x,
          ...patch,
          updatedAt: new Date().toISOString()
        }
      : x
  );
  await replaceCollection("parameterMemory" as any, next);
  return next.find((x: any) => x.id === id) || null;
}

export async function createParameterRow(body: Record<string, any>) {
  const db = await readStore();
  const rows = Array.isArray(db.parameterMemory) ? db.parameterMemory : [];
  const row = {
    id: nextId(),
    region: body.region || "Unbekannt",
    trade: body.trade || "Unbekannt",
    parameterType: body.parameterType || "cost",
    parameterKey: body.parameterKey || "default_rate",
    value: body.value ?? null,
    unit: body.unit || "",
    source: body.source || "manual",
    confidence: body.confidence ?? 0.8,
    status: body.status || "draft",
    note: body.note || "",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  await replaceCollection("parameterMemory" as any, [...rows, row]);
  return row;
}

export async function learnFromOpportunity(opportunityId: string, payload: Record<string, any>) {
  const db = await readStore();
  const opportunities = Array.isArray(db.opportunities) ? db.opportunities : [];
  const opportunity = opportunities.find((x: any) => x.id === opportunityId);

  if (!opportunity) throw new Error("Opportunity nicht gefunden");

  const rows = Array.isArray(db.parameterMemory) ? db.parameterMemory : [];
  const additions: any[] = [];

  if (payload.defaultRate !== undefined && payload.defaultRate !== null && payload.defaultRate !== "") {
    additions.push({
      id: nextId(),
      region: opportunity.region || "Unbekannt",
      trade: opportunity.trade || "Unbekannt",
      parameterType: "cost",
      parameterKey: "default_rate",
      value: Number(payload.defaultRate),
      unit: payload.unit || "",
      source: "opportunity_feedback",
      confidence: 0.9,
      status: payload.status || "confirmed",
      note: payload.note || "Aus Opportunity-Lernfeedback übernommen.",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  }

  if (payload.travelCost !== undefined && payload.travelCost !== null && payload.travelCost !== "") {
    additions.push({
      id: nextId(),
      region: opportunity.region || "Unbekannt",
      trade: opportunity.trade || "Unbekannt",
      parameterType: "cost",
      parameterKey: "travel_cost",
      value: Number(payload.travelCost),
      unit: payload.travelUnit || "€",
      source: "opportunity_feedback",
      confidence: 0.85,
      status: payload.status || "confirmed",
      note: payload.note || "Anfahrtskosten aus Opportunity-Lernfeedback.",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  }

  if (payload.specKey && payload.specValue !== undefined && payload.specValue !== "") {
    additions.push({
      id: nextId(),
      region: opportunity.region || "Unbekannt",
      trade: opportunity.trade || "Unbekannt",
      parameterType: "spec",
      parameterKey: String(payload.specKey),
      value: payload.specValue,
      unit: payload.specUnit || "",
      source: "opportunity_feedback",
      confidence: 0.8,
      status: payload.status || "confirmed",
      note: payload.note || "Spezifikation aus Opportunity-Lernfeedback.",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  }

  await replaceCollection("parameterMemory" as any, [...rows, ...additions]);

  return {
    ok: true,
    added: additions.length,
    rows: additions
  };
}
