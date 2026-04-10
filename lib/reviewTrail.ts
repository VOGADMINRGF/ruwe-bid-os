import { readStore, replaceCollection } from "@/lib/storage";

function nextId(prefix = "review") {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export async function appendReviewTrail(row: Record<string, any>) {
  const db = await readStore();
  const rows = Array.isArray(db.reviewTrail) ? db.reviewTrail : [];
  const entry = {
    id: nextId(),
    createdAt: new Date().toISOString(),
    ...row
  };
  await replaceCollection("reviewTrail" as any, [entry, ...rows]);
  return entry;
}

export async function listReviewTrail(opportunityId?: string) {
  const db = await readStore();
  const rows = Array.isArray(db.reviewTrail) ? db.reviewTrail : [];
  return opportunityId ? rows.filter((x: any) => x.opportunityId === opportunityId) : rows;
}
