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

export async function updateSourceRegistryEntry(sourceId: string, patch: Record<string, any>) {
  const db = await readStore();
  const rows = Array.isArray(db.sourceRegistry) ? db.sourceRegistry : [];
  const allowed = {
    name: patch?.name,
    active: patch?.active,
    legalUse: patch?.legalUse,
    dataMode: patch?.dataMode,
    notes: patch?.notes,
    type: patch?.type,
    supportsFeed: patch?.supportsFeed,
    supportsManualImport: patch?.supportsManualImport,
    supportsDeepLink: patch?.supportsDeepLink,
    lastQuery: patch?.lastQuery
  };

  let updated: any = null;
  const next = rows.map((x: any) => {
    if (x.id !== sourceId) return x;
    updated = {
      ...x,
      ...Object.fromEntries(
        Object.entries(allowed).filter(([, value]) => value !== undefined)
      ),
      updatedAt: nowIso()
    };
    return updated;
  });

  if (!updated) return null;
  await replaceCollection("sourceRegistry", next);
  return updated;
}

export async function listSourceRegistry() {
  await ensureSourceRegistryDefaults();
  const db = await readStore();
  return Array.isArray(db.sourceRegistry) ? db.sourceRegistry : [];
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
    notes: "",
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
