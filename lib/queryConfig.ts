import { readStore, replaceCollection } from "@/lib/storage";

function nextId(prefix = "qcfg") {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

const DEFAULT_ROWS = [
  { sourceId: "src_service_bund", trade: "Winterdienst", region: "Berlin", query: "Winterdienst Berlin", active: true, priority: "A" },
  { sourceId: "src_service_bund", trade: "Reinigung", region: "Berlin", query: "Reinigung Berlin", active: true, priority: "A" },
  { sourceId: "src_service_bund", trade: "Glasreinigung", region: "Berlin", query: "Glasreinigung Berlin", active: true, priority: "A" },
  { sourceId: "src_service_bund", trade: "Hausmeister", region: "Magdeburg", query: "Hausmeister Magdeburg", active: true, priority: "B" },
  { sourceId: "src_service_bund", trade: "Sicherheit", region: "Magdeburg", query: "Sicherheit Magdeburg", active: true, priority: "A" },
  { sourceId: "src_service_bund", trade: "Grünpflege", region: "Potsdam", query: "Grünpflege Potsdam", active: true, priority: "B" },
  { sourceId: "src_ted", trade: "Reinigung", region: "Berlin", query: "Reinigung Berlin", active: true, priority: "B" },
  { sourceId: "src_dtvp", trade: "Winterdienst", region: "Leipzig", query: "Winterdienst Leipzig", active: true, priority: "B" }
];

export async function ensureQueryConfig() {
  const db = await readStore();
  const rows = Array.isArray(db.queryConfig) ? db.queryConfig : [];
  if (rows.length) return rows;

  const next = DEFAULT_ROWS.map((x) => ({
    id: nextId(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...x
  }));

  await replaceCollection("queryConfig" as any, next);
  return next;
}

export async function listQueryConfig() {
  await ensureQueryConfig();
  const db = await readStore();
  return Array.isArray(db.queryConfig) ? db.queryConfig : [];
}

export async function createQueryConfig(body: Record<string, any>) {
  const db = await readStore();
  const rows = Array.isArray(db.queryConfig) ? db.queryConfig : [];
  const row = {
    id: nextId(),
    sourceId: body.sourceId || "src_service_bund",
    trade: body.trade || "Unbekannt",
    region: body.region || "",
    query: body.query || "",
    active: body.active !== false,
    priority: body.priority || "B",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  await replaceCollection("queryConfig" as any, [...rows, row]);
  return row;
}

export async function updateQueryConfig(id: string, patch: Record<string, any>) {
  const db = await readStore();
  const rows = Array.isArray(db.queryConfig) ? db.queryConfig : [];
  const next = rows.map((x: any) =>
    x.id === id ? { ...x, ...patch, updatedAt: new Date().toISOString() } : x
  );
  await replaceCollection("queryConfig" as any, next);
  return next.find((x: any) => x.id === id) || null;
}
