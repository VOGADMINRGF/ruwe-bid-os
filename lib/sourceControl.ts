import { readStore, replaceCollection } from "@/lib/storage";

function nowIso() {
  return new Date().toISOString();
}

export async function updateSourceRegistryStatus(sourceId: string, patch: Record<string, any>) {
  const db = await readStore();
  const rows = Array.isArray(db.sourceRegistry) ? db.sourceRegistry : [];
  const next = rows.map((x: any) =>
    x.id === sourceId
      ? { ...x, ...patch, updatedAt: nowIso() }
      : x
  );
  await replaceCollection("sourceRegistry", next);
}

export async function ensureSourceRegistryDefaults() {
  const db = await readStore();
  const rows = Array.isArray(db.sourceRegistry) ? db.sourceRegistry : [];
  const next = rows.map((x: any) => ({
    active: true,
    status: "idle",
    lastRunAt: null,
    lastRunOk: null,
    lastRunCount: 0,
    lastError: null,
    supportsDeepLink: false,
    ...x
  }));
  await replaceCollection("sourceRegistry", next);
  return next;
}

export function sourceSummary(registry: any[]) {
  return (registry || []).map((x: any) => ({
    id: x.id,
    name: x.name || x.id,
    active: !!x.active,
    status: x.status || "idle",
    lastRunAt: x.lastRunAt || null,
    lastRunOk: x.lastRunOk ?? null,
    lastRunCount: x.lastRunCount || 0,
    lastError: x.lastError || null,
    supportsDeepLink: !!x.supportsDeepLink
  }));
}
