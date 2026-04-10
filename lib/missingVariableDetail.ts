import { readStore } from "@/lib/storage";
import { toPlain } from "@/lib/serializers";

export async function getMissingVariableDetail(id: string) {
  const db = await readStore();
  const rows = Array.isArray(db.costGaps) ? db.costGaps : [];
  const opps = Array.isArray(db.opportunities) ? db.opportunities : [];
  const params = Array.isArray(db.parameterMemory) ? db.parameterMemory : [];

  const variable = rows.find((x: any) => x.id === id);
  if (!variable) return null;

  const opportunity = opps.find((x: any) => x.id === variable.opportunityId) || null;
  const matchingParams = params.filter((x: any) =>
    x?.type === variable.type ||
    (variable.region && x?.region === variable.region) ||
    (variable.trade && x?.trade === variable.trade)
  );

  return toPlain({
    variable,
    opportunity,
    matchingParams
  });
}
