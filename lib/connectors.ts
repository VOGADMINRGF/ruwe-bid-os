import { readStore, replaceCollection } from "@/lib/storage";

function nextId(prefix = "conn") {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

const DEFAULT_CONNECTORS = [
  {
    id: "src_service_bund",
    name: "service.bund.de",
    authType: "none",
    baseUrl: "https://www.service.bund.de",
    active: true,
    supportsFeed: true,
    supportsQuerySearch: true,
    supportsManualImport: true,
    supportsDeepLink: true,
    status: "idle",
    lastTestAt: null,
    lastTestOk: null,
    lastTestMessage: null
  },
  {
    id: "src_ted",
    name: "TED",
    authType: "none",
    baseUrl: "https://ted.europa.eu",
    active: true,
    supportsFeed: true,
    supportsQuerySearch: true,
    supportsManualImport: true,
    supportsDeepLink: true,
    status: "idle",
    lastTestAt: null,
    lastTestOk: null,
    lastTestMessage: null
  },
  {
    id: "src_berlin",
    name: "Vergabeplattform Berlin",
    authType: "none",
    baseUrl: "https://www.berlin.de/vergabeplattform/veroeffentlichungen/bekanntmachungen/feed.rss",
    active: true,
    supportsFeed: true,
    supportsQuerySearch: true,
    supportsManualImport: true,
    supportsDeepLink: true,
    status: "idle",
    lastTestAt: null,
    lastTestOk: null,
    lastTestMessage: null
  },
  {
    id: "src_dtvp",
    name: "DTVP",
    authType: "none",
    baseUrl: "",
    active: true,
    supportsFeed: true,
    supportsQuerySearch: false,
    supportsManualImport: true,
    supportsDeepLink: false,
    status: "idle",
    lastTestAt: null,
    lastTestOk: null,
    lastTestMessage: null
  }
];

export async function ensureConnectors() {
  const db = await readStore();
  const rows = Array.isArray(db.connectors) ? db.connectors : [];
  if (rows.length) {
    const byId = new Map(DEFAULT_CONNECTORS.map((x) => [x.id, x]));
    const next = rows.map((row: any) => {
      const defaults = byId.get(row.id);
      if (!defaults) return row;
      return {
        ...defaults,
        ...row,
        supportsQuerySearch: defaults.supportsQuerySearch,
        updatedAt: new Date().toISOString()
      };
    });
    await replaceCollection("connectors" as any, next);
    return next;
  }
  await replaceCollection("connectors" as any, DEFAULT_CONNECTORS);
  return DEFAULT_CONNECTORS;
}

export async function listConnectors() {
  await ensureConnectors();
  const db = await readStore();
  return Array.isArray(db.connectors) ? db.connectors : [];
}

export async function createConnector(body: Record<string, any>) {
  const db = await readStore();
  const rows = Array.isArray(db.connectors) ? db.connectors : [];
  const row = {
    id: body.id || nextId(),
    name: body.name || "Neue Quelle",
    authType: body.authType || "none",
    baseUrl: body.baseUrl || "",
    username: body.username || "",
    password: body.password || "",
    apiKey: body.apiKey || "",
    active: body.active !== false,
    supportsFeed: !!body.supportsFeed,
    supportsQuerySearch: !!body.supportsQuerySearch,
    supportsManualImport: body.supportsManualImport !== false,
    supportsDeepLink: !!body.supportsDeepLink,
    status: "idle",
    lastTestAt: null,
    lastTestOk: null,
    lastTestMessage: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  await replaceCollection("connectors" as any, [...rows, row]);
  return row;
}

export async function updateConnector(id: string, patch: Record<string, any>) {
  const db = await readStore();
  const rows = Array.isArray(db.connectors) ? db.connectors : [];
  const next = rows.map((x: any) =>
    x.id === id
      ? { ...x, ...patch, updatedAt: new Date().toISOString() }
      : x
  );
  await replaceCollection("connectors" as any, next);
  return next.find((x: any) => x.id === id) || null;
}

export async function testConnector(id: string) {
  const rows = await listConnectors();
  const row = rows.find((x: any) => x.id === id);
  if (!row) throw new Error("Connector nicht gefunden");

  const ok = !!row.baseUrl || row.authType !== "none";
  const message = ok
    ? "Testlauf erfolgreich vorbereitet."
    : "Basis-URL oder Auth-Informationen fehlen.";

  return await updateConnector(id, {
    status: ok ? "ready" : "attention",
    lastTestAt: new Date().toISOString(),
    lastTestOk: ok,
    lastTestMessage: message
  });
}
