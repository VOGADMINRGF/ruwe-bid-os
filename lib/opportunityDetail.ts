import { readStore, replaceCollection } from "@/lib/storage";
import { toPlain } from "@/lib/serializers";

export async function getOpportunityDetail(id: string) {
  const db = await readStore();

  const opportunities = Array.isArray(db.opportunities) ? db.opportunities : [];
  const missingVariables = Array.isArray(db.costGaps) ? db.costGaps : [];
  const parameterMemory = Array.isArray(db.parameterMemory) ? db.parameterMemory : [];
  const sourceHits = Array.isArray(db.sourceHits) ? db.sourceHits : [];
  const notes = Array.isArray((db as any).opportunityNotes) ? (db as any).opportunityNotes : [];

  const opportunity = opportunities.find((x: any) => x.id === id);
  if (!opportunity) return null;

  const sourceHit = sourceHits.find((x: any) => x.id === opportunity.sourceHitId) || null;
  const vars = missingVariables.filter((x: any) => x.opportunityId === id);
  const params = parameterMemory.filter((x: any) =>
    (x.region && x.region === opportunity.region) ||
    (x.trade && x.trade === opportunity.trade) ||
    (!x.region && !x.trade)
  );

  const ownNotes = notes.filter((x: any) => x.opportunityId === id);

  return toPlain({
    opportunity,
    sourceHit,
    missingVariables: vars,
    parameterMemory: params,
    notes: ownNotes
  });
}

export async function updateOpportunityStatus(id: string, patch: Record<string, any>) {
  const db = await readStore();
  const rows = Array.isArray(db.opportunities) ? db.opportunities : [];
  const next = rows.map((x: any) =>
    x.id === id
      ? {
          ...x,
          ...patch,
          updatedAt: new Date().toISOString()
        }
      : x
  );

  await replaceCollection("opportunities", next as any);
  return toPlain(next.find((x: any) => x.id === id) || null);
}

export async function addOpportunityNote(id: string, input: { author?: string; text: string }) {
  const db = await readStore();
  const rows = Array.isArray((db as any).opportunityNotes) ? (db as any).opportunityNotes : [];
  const entry = {
    id: `note_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    opportunityId: id,
    author: input.author || "system",
    text: input.text,
    createdAt: new Date().toISOString()
  };
  await replaceCollection("opportunityNotes" as any, [...rows, entry] as any);
  return toPlain(entry);
}
