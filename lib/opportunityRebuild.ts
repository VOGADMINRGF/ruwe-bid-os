import { readStore, replaceCollection } from "@/lib/storage";
import { buildOpportunityFromHit } from "@/lib/opportunitySchema";
import { deriveMissingVariables } from "@/lib/missingVariables";
import { assignOpportunity } from "@/lib/assignmentEngine";
import { toPlain } from "@/lib/serializers";

export async function rebuildOpportunities() {
  const db = await readStore();
  const hits = Array.isArray(db.sourceHits) ? db.sourceHits : [];
  const parameterMemory = Array.isArray(db.parameterMemory) ? db.parameterMemory : [];

  const opportunities = [];
  const missingVariables = [];

  for (const hit of hits) {
    const opp = buildOpportunityFromHit(hit);
    const assignment = assignOpportunity(opp);
    const vars = deriveMissingVariables(opp, parameterMemory);

    opportunities.push({
      ...opp,
      ownerId: assignment.ownerId,
      supportOwnerId: assignment.supportOwnerId,
      missingVariableCount: vars.length,
      nextQuestion: vars[0]?.question || null,
      stage:
        opp.decision === "Bid" ? "qualifiziert" :
        vars.length > 0 ? "review" :
        "beobachten"
    });

    for (const v of vars) {
      missingVariables.push({
        ...v,
        ownerId: assignment.ownerId,
        supportOwnerId: assignment.supportOwnerId
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
