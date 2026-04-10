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
  const rawValue = typeof value === "string" ? value.trim() : value;
  if (rawValue === "" || rawValue == null) {
    throw new Error("Antwortwert fehlt");
  }

  if (row.answerPattern && typeof rawValue === "string") {
    const re = new RegExp(String(row.answerPattern));
    if (!re.test(rawValue)) {
      throw new Error("Antwort entspricht nicht dem erwarteten Format");
    }
  }

  let normalizedValue: any = rawValue;
  const kind = String(row.answerKind || "").toLowerCase();
  if (["zahl", "geldbetrag", "stundensatz"].includes(kind)) {
    const num = Number(String(rawValue).replace(",", "."));
    if (!Number.isFinite(num)) throw new Error("Numerischer Wert erwartet");
    normalizedValue = num;
  }
  if (kind === "ja_nein") {
    const yes = ["ja", "yes", "true", "1"];
    normalizedValue = yes.includes(String(rawValue).toLowerCase()) ? "ja" : "nein";
  }

  const parameterRows = Array.isArray(db.parameterMemory) ? db.parameterMemory : [];
  const existingParamIdx = parameterRows.findIndex((x: any) =>
    x?.type === row.type &&
    (x?.region || null) === (row.region || null) &&
    (x?.trade || null) === (row.trade || null) &&
    (x?.parameterKey || x?.key || null) === row.type
  );

  const nextParam =
    existingParamIdx >= 0
      ? {
          ...parameterRows[existingParamIdx],
          value: normalizedValue,
          status,
          source: "admin_answer",
          updatedAt: new Date().toISOString()
        }
      : {
          id: `pm_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          type: row.type,
          region: row.region || null,
          trade: row.trade || null,
          parameterKey: row.type,
          value: normalizedValue,
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
          answeredValue: normalizedValue,
          answeredAt: new Date().toISOString()
        }
      : x
  );

  const nextParams =
    existingParamIdx >= 0
      ? parameterRows.map((x: any, i: number) => (i === existingParamIdx ? nextParam : x))
      : [...parameterRows, nextParam];

  await replaceCollection("parameterMemory", nextParams);
  await replaceCollection("costGaps", nextRows);

  const opportunities = Array.isArray(db.opportunities) ? db.opportunities : [];
  if (row.opportunityId) {
    const nextOpps = opportunities.map((opp: any) => {
      if (opp.id !== row.opportunityId) return opp;
      const patch: Record<string, any> = {};
      if (row.type === "calc_mode") patch.calcMode = String(normalizedValue);
      if (row.type === "due_date") patch.dueDate = String(normalizedValue);
      if (row.type === "buyer") patch.buyer = String(normalizedValue);
      if (row.type === "direct_link") {
        patch.linkManualReview = normalizedValue === "ja" ? "required" : "declined";
      }
      return {
        ...opp,
        ...patch,
        updatedAt: new Date().toISOString()
      };
    });
    await replaceCollection("opportunities", nextOpps);
  }

  return toPlain({
    variable: nextRows.find((x: any) => x.id === id),
    parameter: nextParam
  });
}
