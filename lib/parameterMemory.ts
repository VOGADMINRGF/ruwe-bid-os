import { readStore, replaceCollection } from "@/lib/storage";

export type ParameterMemoryRow = {
  id: string;
  region: string;
  trade: string;
  parameterType: string;
  parameterKey: string;
  value: string | number | null;
  unit?: string;
  source?: string;
  confidence?: number;
  status?: "open" | "draft" | "confirmed";
  note?: string;
  createdAt?: string;
  updatedAt?: string;
};

function nextId(prefix = "pmem") {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export async function listParameterMemory() {
  const db = await readStore();
  return Array.isArray(db.parameterMemory) ? db.parameterMemory : [];
}

export async function upsertParameterMemory(row: Partial<ParameterMemoryRow>) {
  const db = await readStore();
  const current = Array.isArray(db.parameterMemory) ? db.parameterMemory : [];

  const keyMatch = current.find((x: any) =>
    String(x.region || "") === String(row.region || "") &&
    String(x.trade || "") === String(row.trade || "") &&
    String(x.parameterType || "") === String(row.parameterType || "") &&
    String(x.parameterKey || "") === String(row.parameterKey || "")
  );

  if (keyMatch) {
    const next = current.map((x: any) =>
      x.id === keyMatch.id
        ? {
            ...x,
            ...row,
            updatedAt: new Date().toISOString()
          }
        : x
    );
    await replaceCollection("parameterMemory" as any, next);
    return next.find((x: any) => x.id === keyMatch.id);
  }

  const created = {
    id: nextId(),
    region: row.region || "Unbekannt",
    trade: row.trade || "Unbekannt",
    parameterType: row.parameterType || "unknown",
    parameterKey: row.parameterKey || "unknown",
    value: row.value ?? null,
    unit: row.unit || "",
    source: row.source || "system",
    confidence: row.confidence ?? 0.5,
    status: row.status || "open",
    note: row.note || "",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  await replaceCollection("parameterMemory" as any, [...current, created]);
  return created;
}

export async function findParameter(region: string, trade: string, parameterType: string, parameterKey: string) {
  const db = await readStore();
  const current = Array.isArray(db.parameterMemory) ? db.parameterMemory : [];

  return (
    current.find((x: any) =>
      x.region === region &&
      x.trade === trade &&
      x.parameterType === parameterType &&
      x.parameterKey === parameterKey &&
      x.status === "confirmed"
    ) ||
    current.find((x: any) =>
      x.trade === trade &&
      x.parameterType === parameterType &&
      x.parameterKey === parameterKey &&
      x.status === "confirmed"
    ) ||
    null
  );
}
