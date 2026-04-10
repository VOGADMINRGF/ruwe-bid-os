import { readStore, replaceCollection } from "@/lib/storage";
import { buildOpportunityFromHit } from "@/lib/opportunitySchema";
import { deriveMissingVariables } from "@/lib/missingVariables";
import { assignOpportunity } from "@/lib/assignmentEngine";
import { toPlain } from "@/lib/serializers";

export async function rebuildOpportunities() {
  const db = await readStore();
  const hits = Array.isArray(db.sourceHits) ? db.sourceHits : [];
  const parameterMemory = Array.isArray(db.parameterMemory) ? db.parameterMemory : [];
  const existingMissing = Array.isArray(db.costGaps) ? db.costGaps : [];

  const opportunities = [];
  const missingVariables = [];

  for (const hit of hits) {
    const opp = buildOpportunityFromHit(hit);
    const assignment = assignOpportunity(opp);
    const vars = deriveMissingVariables(opp, parameterMemory).map((v: any) => {
      const prev = existingMissing.find((x: any) => x.id === v.id);
      if (!prev) return v;
      if (prev.status === "beantwortet") {
        return {
          ...v,
          status: prev.status,
          answeredValue: prev.answeredValue,
          answeredAt: prev.answeredAt,
          updatedAt: prev.updatedAt || prev.answeredAt || new Date().toISOString()
        };
      }
      return {
        ...v,
        status: prev.status || v.status,
        updatedAt: prev.updatedAt || new Date().toISOString()
      };
    });
    const openVars = vars.filter((v: any) => v.status !== "beantwortet");

    opportunities.push({
      ...opp,
      ownerId: assignment.ownerId,
      supportOwnerId: assignment.supportOwnerId,
      missingVariableCount: openVars.length,
      nextQuestion: openVars[0]?.question || null,
      stage:
        opp.decision === "Bid" ? "qualifiziert" :
        opp.decision === "Prüfen" ? "review" :
        openVars.length > 0 ? "review" :
        "beobachten"
    });

    for (const v of vars) {
      missingVariables.push({
        ...v,
        ownerId: assignment.ownerId,
        supportOwnerId: assignment.supportOwnerId,
        updatedAt: v.updatedAt || new Date().toISOString()
      });
    }
  }

  await replaceCollection("opportunities", toPlain(opportunities));
  await replaceCollection("costGaps", toPlain(missingVariables));

  return toPlain({
    opportunities: opportunities.length,
    missingVariables: missingVariables.length
  });
}
