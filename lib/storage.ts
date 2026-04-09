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
  globalKeywords: {
    positive: [],
    negative: []
  },
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
    return EMPTY_STORE;
  }
}

async function writeJsonFile(db: StoreShape) {
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(db, null, 2) + "\n", "utf8");
}

async function readMongoStore(): Promise<StoreShape | null> {
  const uri = process.env.MONGODB_URI;
  if (!uri) return null;

  const dbName = process.env.MONGODB_DB_NAME || "ruwe_bid_os";
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db(dbName);

    const collections: StoreCollection[] = [
      "meta",
      "config",
      "sourceRegistry",
      "sourceStats",
      "sourceHits",
      "sites",
      "serviceAreas",
      "siteTradeRules",
      "buyers",
      "agents",
      "agentKeywords",
      "globalKeywords",
      "tenders",
      "pipeline",
      "references",
      "graphNodes",
      "graphEdges"
    ];

    const out: any = {};

    for (const name of collections) {
      const rows = await db.collection(name).find({}).toArray();

      if (name === "meta" || name === "config") {
        out[name] = rows[0] || {};
      } else if (name === "globalKeywords") {
        out[name] = rows[0] || { positive: [], negative: [] };
      } else {
        out[name] = rows;
      }
    }

    return normalizeStore(out);
  } catch {
    return null;
  } finally {
    await client.close();
  }
}

async function replaceMongoCollection(name: StoreCollection, value: any) {
  const uri = process.env.MONGODB_URI;
  if (!uri) return false;

  const dbName = process.env.MONGODB_DB_NAME || "ruwe_bid_os";
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db(dbName);
    const col = db.collection(name);

    await col.deleteMany({});

    if (name === "meta" || name === "config" || name === "globalKeywords") {
      if (value && (typeof value === "object")) {
        await col.insertOne(value);
      }
    } else if (Array.isArray(value) && value.length) {
      await col.insertMany(value);
    }

    return true;
  } finally {
    await client.close();
  }
}

export async function readStore(): Promise<StoreShape> {
  const mongo = await readMongoStore();
  if (mongo) return mongo;
  return readJsonFile();
}

/* Rückwärtskompatibilität */
export const readDb = readStore;
export const readJsonDb = readJsonFile;

export async function replaceCollection(name: StoreCollection, value: any) {
  const mongoOk = await replaceMongoCollection(name, value);
  if (mongoOk) return;

  const db = await readJsonFile();

  if (name === "meta" || name === "config" || name === "globalKeywords") {
    db[name] = value;
  } else {
    db[name] = Array.isArray(value) ? value : [];
  }

  await writeJsonFile(db);
}

/* Rückwärtskompatibilität */
export async function writeDb(next: StoreShape) {
  const collections: StoreCollection[] = [
    "meta",
    "config",
    "sourceRegistry",
    "sourceStats",
    "sourceHits",
    "sites",
    "serviceAreas",
    "siteTradeRules",
    "buyers",
    "agents",
    "agentKeywords",
    "globalKeywords",
    "tenders",
    "pipeline",
    "references",
    "graphNodes",
    "graphEdges"
  ];

  for (const key of collections) {
    await replaceCollection(key, next[key]);
  }
}

export async function writeJsonDb(next: StoreShape) {
  await writeJsonFile(normalizeStore(next));
}

export function createId(prefix = "id") {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}
