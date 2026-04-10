import { readStore, replaceCollection } from "@/lib/storage";
import { toPlain } from "@/lib/serializers";

export async function listMissingVariables() {
  const db = await readStore();
  return toPlain(Array.isArray(db.costGaps) ? db.costGaps : []);
}

export async function updateMissingVariable(id: string, patch: Record<string, any>) {
  const db = await readStore();
  const rows = Array.isArray(db.costGaps) ? db.costGaps : [];
  const next = rows.map((x: any) =>
    x.id === id
      ? {
          ...x,
          ...patch,
          updatedAt: new Date().toISOString()
        }
      : x
  );
  await replaceCollection("costGaps", next);
  return toPlain(next.find((x: any) => x.id === id) || null);
}

export async function closeMissingVariableWithParameter(id: string, value: any, status = "defined") {
  const db = await readStore();
  const rows = Array.isArray(db.costGaps) ? db.costGaps : [];
  const row = rows.find((x: any) => x.id === id);
  if (!row) return null;

  const parameterRows = Array.isArray(db.parameterMemory) ? db.parameterMemory : [];
  const nextParam = {
    id: `pm_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    type: row.type,
    region: row.region || null,
    trade: row.trade || null,
    parameterKey: row.type,
    value,
    status,
    source: "admin_answer",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const nextRows = rows.map((x: any) =>
    x.id === id
      ? {
          ...x,
          status: "beantwortet",
          answeredValue: value,
          answeredAt: new Date().toISOString()
        }
      : x
  );

  await replaceCollection("parameterMemory", [...parameterRows, nextParam]);
  await replaceCollection("costGaps", nextRows);

  return toPlain({
    variable: nextRows.find((x: any) => x.id === id),
    parameter: nextParam
  });
}
