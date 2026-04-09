import { readStore, replaceCollection } from "@/lib/storage";

function nextId(prefix = "qrun") {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export async function appendQueryRun(row: Record<string, any>) {
  const db = await readStore();
  const rows = Array.isArray(db.queryHistory) ? db.queryHistory : [];
  const next = [
    {
      id: nextId(),
      createdAt: new Date().toISOString(),
      ...row
    },
    ...rows
  ];
  await replaceCollection("queryHistory" as any, next);
  return next[0];
}

export async function listQueryRuns() {
  const db = await readStore();
  return Array.isArray(db.queryHistory) ? db.queryHistory : [];
}
