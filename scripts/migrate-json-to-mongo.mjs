import nextEnv from '@next/env';
import fs from "fs/promises";
import path from "path";
import { MongoClient } from "mongodb";

const { loadEnvConfig } = nextEnv;
const projectDir = process.cwd();
loadEnvConfig(projectDir);

const mongoUri = process.env.MONGODB_URI || "";
const dbName = process.env.MONGODB_DB_NAME || "ruwe_bid_os";

if (!mongoUri) {
  console.log("MONGODB_URI fehlt. Migration übersprungen.");
  process.exit(0);
}

const file = path.join(projectDir, "data", "db.json");
const raw = await fs.readFile(file, "utf8");
const json = JSON.parse(raw);

const graphNodes = [];
const graphEdges = [];

for (const s of json.sites || []) graphNodes.push({ type: "site", refId: s.id, label: s.name });
for (const s of json.serviceAreas || []) graphNodes.push({ type: "service_area", refId: s.id, label: s.name });
for (const t of json.tenders || []) graphNodes.push({ type: "tender", refId: t.id, label: t.title });
for (const b of json.buyers || []) graphNodes.push({ type: "buyer", refId: b.id, label: b.name });
for (const a of json.agents || []) graphNodes.push({ type: "agent", refId: a.id, label: a.name });
for (const r of json.references || []) graphNodes.push({ type: "reference", refId: r.id, label: r.title });

for (const area of json.serviceAreas || []) {
  graphEdges.push({
    type: "SERVICE_AREA_OF",
    fromType: "service_area",
    fromRefId: area.id,
    toType: "site",
    toRefId: area.siteId
  });
}

for (const tender of json.tenders || []) {
  if (tender.matchedSiteId) {
    graphEdges.push({
      type: "MATCHED_SITE",
      fromType: "tender",
      fromRefId: tender.id,
      toType: "site",
      toRefId: tender.matchedSiteId
    });
  }
  if (tender.buyerId) {
    graphEdges.push({
      type: "HAS_BUYER",
      fromType: "tender",
      fromRefId: tender.id,
      toType: "buyer",
      toRefId: tender.buyerId
    });
  }
  if (tender.ownerId) {
    graphEdges.push({
      type: "HANDLED_BY",
      fromType: "tender",
      fromRefId: tender.id,
      toType: "agent",
      toRefId: tender.ownerId
    });
  }
}

const client = new MongoClient(mongoUri);
await client.connect();
const db = client.db(dbName);

const docs = {
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

for (const [name, rows] of Object.entries(docs)) {
  const col = db.collection(name);
  await col.deleteMany({});
  if (rows.length) await col.insertMany(rows);
}

await client.close();

console.log("Migration erfolgreich:");
console.log({
  sites: docs.sites.length,
  serviceAreas: docs.serviceAreas.length,
  siteTradeRules: docs.siteTradeRules.length,
  tenders: docs.tenders.length,
  graphNodes: docs.graphNodes.length,
  graphEdges: docs.graphEdges.length
});
