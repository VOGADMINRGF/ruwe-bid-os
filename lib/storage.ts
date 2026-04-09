import { hasMongo } from "./env";
import { getMongoDb } from "./mongo";
import { readJsonDb, writeJsonDb, createId } from "./db";
import { buildGraphEdgesFromDb, buildGraphNodesFromDb } from "./graph";

const COLLECTIONS = [
  "meta",
  "config",
  "sourceStats",
  "sites",
  "serviceAreas",
  "siteTradeRules",
  "buyers",
  "agents",
  "tenders",
  "pipeline",
  "references",
  "graphNodes",
  "graphEdges"
] as const;

type CollectionName = typeof COLLECTIONS[number];

async function ensureMongoSeededFromJson() {
  if (!hasMongo()) return;

  const db = await getMongoDb();
  const existing = await db.collection("meta").countDocuments();
  if (existing > 0) return;

  const json = await readJsonDb();
  const graphNodes = buildGraphNodesFromDb(json);
  const graphEdges = buildGraphEdgesFromDb(json);

  const docs: Record<string, any[]> = {
    meta: [json.meta || {}],
    config: [json.config || {}],
    sourceStats: json.sourceStats || [],
    sites: json.sites || [],
    serviceAreas: json.serviceAreas || [],
    siteTradeRules: json.siteTradeRules || [],
    buyers: json.buyers || [],
    agents: json.agents || [],
    tenders: json.tenders || [],
    pipeline: json.pipeline || [],
    references: json.references || [],
    graphNodes,
    graphEdges
  };

  for (const [name, list] of Object.entries(docs)) {
    if (list.length) {
      await db.collection(name).insertMany(list);
    }
  }
}

export async function readStore() {
  if (!hasMongo()) {
    const json = await readJsonDb();
    return {
      ...json,
      graphNodes: buildGraphNodesFromDb(json),
      graphEdges: buildGraphEdgesFromDb(json)
    };
  }

  await ensureMongoSeededFromJson();
  const db = await getMongoDb();

  const result: any = {};
  for (const name of COLLECTIONS) {
    const docs = await db.collection(name).find({}).toArray();
    if (name === "meta" || name === "config") {
      result[name] = docs[0] ? stripMongo(docs[0]) : {};
    } else {
      result[name] = docs.map(stripMongo);
    }
  }
  return result;
}

export async function readCollection(name: CollectionName) {
  const db = await readStore();
  return db[name] || [];
}

export async function readItemById(name: CollectionName, id: string) {
  const rows = await readCollection(name);
  return rows.find((x: any) => x.id === id) || null;
}

export async function replaceCollection(name: CollectionName, rows: any[]) {
  if (!hasMongo()) {
    const json = await readJsonDb();
    if (name === "meta" || name === "config") json[name] = rows[0] || {};
    else json[name] = rows;
    await writeJsonDb(json);
    return;
  }

  const db = await getMongoDb();
  await db.collection(name).deleteMany({});
  if (rows.length) await db.collection(name).insertMany(stampRows(rows));
}

export async function appendToCollection(name: CollectionName, row: any) {
  const stamped = stampRow(row);

  if (!hasMongo()) {
    const json = await readJsonDb();
    if (!Array.isArray(json[name])) json[name] = [];
    json[name].unshift(stamped);
    await writeJsonDb(json);
    return stamped;
  }

  const db = await getMongoDb();
  await db.collection(name).insertOne(stamped);
  return stamped;
}

export async function updateById(name: CollectionName, id: string, patch: any) {
  const stampedPatch = {
    ...patch,
    updatedAt: new Date().toISOString()
  };

  if (!hasMongo()) {
    const json = await readJsonDb();
    const list = json[name] || [];
    const idx = list.findIndex((x: any) => x.id === id);
    if (idx === -1) return null;
    list[idx] = { ...list[idx], ...stampedPatch };
    json[name] = list;
    await writeJsonDb(json);
    return list[idx];
  }

  const db = await getMongoDb();
  await db.collection(name).updateOne({ id }, { $set: stampedPatch });
  const updated = await db.collection(name).findOne({ id });
  return updated ? stripMongo(updated) : null;
}

export async function deleteById(name: CollectionName, id: string) {
  if (!hasMongo()) {
    const json = await readJsonDb();
    json[name] = (json[name] || []).filter((x: any) => x.id !== id);
    await writeJsonDb(json);
    return { ok: true };
  }

  const db = await getMongoDb();
  await db.collection(name).deleteOne({ id });
  return { ok: true };
}

export function nextId(prefix: string) {
  return createId(prefix);
}

function stripMongo(doc: any) {
  if (!doc) return doc;
  const { _id, ...rest } = doc;
  return rest;
}

function stampRow(row: any) {
  return {
    createdAt: row.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...row
  };
}

function stampRows(rows: any[]) {
  return rows.map(stampRow);
}
