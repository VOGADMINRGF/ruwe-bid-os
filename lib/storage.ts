import { promises as fs } from "fs";
import path from "path";
import { MongoClient } from "mongodb";

const DATA_FILE = path.join(process.cwd(), "data", "db.json");

export type StoreCollection =
  | "meta"
  | "config"
  | "sourceRegistry"
  | "sourceStats"
  | "sourceHits"
  | "sites"
  | "serviceAreas"
  | "siteTradeRules"
  | "buyers"
  | "agents"
  | "agentKeywords"
  | "globalKeywords"
  | "costModels"
  | "costGaps"
  | "parameterMemory"
  | "opportunities"
  | "tenders"
  | "pipeline"
  | "references"
  | "graphNodes"
  | "graphEdges";

export type StoreShape = {
  meta: Record<string, any>;
  config: Record<string, any>;
  sourceRegistry: any[];
  sourceStats: any[];
  sourceHits: any[];
  sites: any[];
  serviceAreas: any[];
  siteTradeRules: any[];
  buyers: any[];
  agents: any[];
  agentKeywords: any[];
  globalKeywords: {
    positive: string[];
    negative: string[];
    [key: string]: any;
  };
  costModels: any[];
  costGaps: any[];
  parameterMemory: any[];
  opportunities: any[];
  tenders: any[];
  pipeline: any[];
  references: any[];
  graphNodes: any[];
  graphEdges: any[];
  [key: string]: any;
};

const EMPTY_STORE: StoreShape = {
  meta: {},
  config: {},
  sourceRegistry: [],
  sourceStats: [],
  sourceHits: [],
  sites: [],
  serviceAreas: [],
  siteTradeRules: [],
  buyers: [],
  agents: [],
  agentKeywords: [],
  globalKeywords: { positive: [], negative: [] },
  costModels: [],
  costGaps: [],
  parameterMemory: [],
  opportunities: [],
  tenders: [],
  pipeline: [],
  references: [],
  graphNodes: [],
  graphEdges: []
};

function normalizeStore(db: any): StoreShape {
  return {
    meta: db?.meta && typeof db.meta === "object" && !Array.isArray(db.meta) ? db.meta : {},
    config: db?.config && typeof db.config === "object" && !Array.isArray(db.config) ? db.config : {},
    sourceRegistry: Array.isArray(db?.sourceRegistry) ? db.sourceRegistry : [],
    sourceStats: Array.isArray(db?.sourceStats) ? db.sourceStats : [],
    sourceHits: Array.isArray(db?.sourceHits) ? db.sourceHits : [],
    sites: Array.isArray(db?.sites) ? db.sites : [],
    serviceAreas: Array.isArray(db?.serviceAreas) ? db.serviceAreas : [],
    siteTradeRules: Array.isArray(db?.siteTradeRules) ? db.siteTradeRules : [],
    buyers: Array.isArray(db?.buyers) ? db.buyers : [],
    agents: Array.isArray(db?.agents) ? db.agents : [],
    agentKeywords: Array.isArray(db?.agentKeywords) ? db.agentKeywords : [],
    costModels: Array.isArray(db?.costModels) ? db.costModels : [],
    costGaps: Array.isArray(db?.costGaps) ? db.costGaps : [],
    parameterMemory: Array.isArray(db?.parameterMemory) ? db.parameterMemory : [],
    opportunities: Array.isArray(db?.opportunities) ? db.opportunities : [],
    globalKeywords:
      db?.globalKeywords && typeof db.globalKeywords === "object" && !Array.isArray(db.globalKeywords)
        ? {
            positive: Array.isArray(db.globalKeywords.positive) ? db.globalKeywords.positive : [],
            negative: Array.isArray(db.globalKeywords.negative) ? db.globalKeywords.negative : [],
            ...db.globalKeywords
          }
        : { positive: [], negative: [] },
    tenders: Array.isArray(db?.tenders) ? db.tenders : [],
    pipeline: Array.isArray(db?.pipeline) ? db.pipeline : [],
    references: Array.isArray(db?.references) ? db.references : [],
    graphNodes: Array.isArray(db?.graphNodes) ? db.graphNodes : [],
    graphEdges: Array.isArray(db?.graphEdges) ? db.graphEdges : []
  };
}

async function readJsonFile(): Promise<StoreShape> {
  try {
    const raw = await fs.readFile(DATA_FILE, "utf8");
    return normalizeStore(JSON.parse(raw));
  } catch {
    return structuredClone(EMPTY_STORE);
  }
}

async function writeJsonFile(db: StoreShape) {
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(normalizeStore(db), null, 2) + "\n", "utf8");
}

async function getMongoConn() {
  const uri = process.env.MONGODB_URI;
  if (!uri) return null;
  const dbName = process.env.MONGODB_DB_NAME || "ruwe_bid_os";
  const client = new MongoClient(uri);
  await client.connect();
  return { client, db: client.db(dbName) };
}

async function readMongoStore(): Promise<StoreShape | null> {
  const conn = await getMongoConn();
  if (!conn) return null;

  try {
    const names: StoreCollection[] = [
      "meta","config","sourceRegistry","sourceStats","sourceHits","sites","serviceAreas",
      "siteTradeRules","buyers","agents","agentKeywords","globalKeywords","costModels","costGaps","parameterMemory","opportunities","tenders",
      "pipeline","references","graphNodes","graphEdges"
    ];

    const out: any = {};
    for (const name of names) {
      const rows = await conn.db.collection(name).find({}).toArray();
      if (name === "meta" || name === "config" || name === "globalKeywords") {
        out[name] = rows[0] || (name === "globalKeywords" ? { positive: [], negative: [] } : {});
      } else {
        out[name] = rows;
      }
    }
    return normalizeStore(out);
  } catch {
    return null;
  } finally {
    await conn.client.close();
  }
}

function asInsertDocs(value: any): any[] {
  if (Array.isArray(value)) {
    return value.filter((x) => x && typeof x === "object" && !Array.isArray(x));
  }
  if (value && typeof value === "object") return [value];
  return [];
}

async function replaceMongoCollection(name: StoreCollection, value: any) {
  const conn = await getMongoConn();
  if (!conn) return false;

  try {
    const col = conn.db.collection(name);
    await col.deleteMany({});

    const docs = asInsertDocs(value);
    if (docs.length > 0) {
      await col.insertMany(docs);
    }
    return true;
  } finally {
    await conn.client.close();
  }
}

export async function readStore(): Promise<StoreShape> {
  const mongo = await readMongoStore();
  if (mongo) return mongo;
  return readJsonFile();
}

export const readDb = readStore;
export const readJsonDb = readJsonFile;

export async function replaceCollection(name: StoreCollection, value: any) {
  const mongoOk = await replaceMongoCollection(name, value);
  if (mongoOk) return;

  const db = await readJsonFile();
  if (name === "meta" || name === "config" || name === "globalKeywords") {
    db[name] = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  } else {
    db[name] = Array.isArray(value) ? value : [];
  }
  await writeJsonFile(db);
}

export async function appendToCollection(name: StoreCollection, row: any) {
  if (name === "meta" || name === "config" || name === "globalKeywords") {
    throw new Error(`appendToCollection not supported for singleton: ${name}`);
  }
  const db = await readStore();
  const current = Array.isArray(db[name]) ? db[name] : [];
  const next = [...current, row];
  await replaceCollection(name, next);
  return row;
}

export async function readItemById(name: StoreCollection, id: string) {
  const db = await readStore();
  const rows = db[name];
  if (!Array.isArray(rows)) return null;
  return rows.find((x: any) => x?.id === id) || null;
}

export async function updateById(name: StoreCollection, id: string, patch: any) {
  if (name === "meta" || name === "config" || name === "globalKeywords") {
    throw new Error(`updateById not supported for singleton: ${name}`);
  }
  const db = await readStore();
  const rows = Array.isArray(db[name]) ? db[name] : [];
  const i = rows.findIndex((x: any) => x?.id === id);
  if (i === -1) return null;

  const updated = { ...rows[i], ...patch, id };
  const next = [...rows];
  next[i] = updated;
  await replaceCollection(name, next);
  return updated;
}

export async function deleteById(name: StoreCollection, id: string) {
  if (name === "meta" || name === "config" || name === "globalKeywords") {
    throw new Error(`deleteById not supported for singleton: ${name}`);
  }
  const db = await readStore();
  const rows = Array.isArray(db[name]) ? db[name] : [];
  const next = rows.filter((x: any) => x?.id !== id);
  await replaceCollection(name, next);
  return { ok: true };
}

export async function writeDb(next: StoreShape) {
  const names: StoreCollection[] = [
    "meta","config","sourceRegistry","sourceStats","sourceHits","sites","serviceAreas",
    "siteTradeRules","buyers","agents","agentKeywords","globalKeywords","costModels","costGaps","parameterMemory","opportunities","tenders",
    "pipeline","references","graphNodes","graphEdges"
  ];
  for (const name of names) {
    await replaceCollection(name, next[name]);
  }
}

export async function writeJsonDb(next: StoreShape) {
  await writeJsonFile(normalizeStore(next));
}

export function createId(prefix = "id") {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

export const nextId = createId;
