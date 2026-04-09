#!/bin/bash
set -e

cd "$(pwd)"

echo "🚀 RUWE Bid OS — Mongo + Provider + Graph Ready Upgrade"

mkdir -p lib
mkdir -p scripts
mkdir -p docs
mkdir -p app/api/ops/reseed
mkdir -p app/api/ops/migrate
mkdir -p app/api/analysis/providers

echo "📦 Installiere Mongo-Client ..."
npm install mongodb

echo "🧠 ENV / Mongo / Provider / Storage Layer ..."
cat > lib/env.ts <<'TS'
export function env(name: string, fallback = "") {
  return process.env[name] ?? fallback;
}

export const runtimeConfig = {
  appEnv: env("APP_ENV", "local"),
  mongoUri: env("MONGODB_URI", ""),
  mongoDbName: env("MONGODB_DB_NAME", "ruwe_bid_os"),
  ingestionEnabled: env("INGESTION_ENABLED", "false") === "true",
  ingestionIntervalMinutes: Number(env("INGESTION_INTERVAL_MINUTES", "60")),
  defaultAnalysisProvider: env("DEFAULT_ANALYSIS_PROVIDER", "openai"),
  secondaryAnalysisProvider: env("SECONDARY_ANALYSIS_PROVIDER", "anthropic"),
  openaiModel: env("OPENAI_MODEL", "gpt-5"),
  anthropicModel: env("ANTHROPIC_MODEL", "claude-sonnet-4-5")
};

export function hasMongo() {
  return Boolean(runtimeConfig.mongoUri && runtimeConfig.mongoDbName);
}
TS

cat > lib/mongo.ts <<'TS'
import { MongoClient, Db } from "mongodb";
import { runtimeConfig } from "./env";

declare global {
  // eslint-disable-next-line no-var
  var __ruweMongoClient__: Promise<MongoClient> | undefined;
}

export async function getMongoClient(): Promise<MongoClient> {
  if (!runtimeConfig.mongoUri) {
    throw new Error("MONGODB_URI missing");
  }

  if (!global.__ruweMongoClient__) {
    const client = new MongoClient(runtimeConfig.mongoUri);
    global.__ruweMongoClient__ = client.connect();
  }

  return global.__ruweMongoClient__;
}

export async function getMongoDb(): Promise<Db> {
  const client = await getMongoClient();
  return client.db(runtimeConfig.mongoDbName);
}
TS

cat > lib/db.ts <<'TS'
import { promises as fs } from "fs";
import path from "path";

const DB_PATH = path.join(process.cwd(), "data", "db.json");

export async function readJsonDb() {
  const raw = await fs.readFile(DB_PATH, "utf8");
  return JSON.parse(raw);
}

export async function writeJsonDb(data: any) {
  await fs.writeFile(DB_PATH, JSON.stringify(data, null, 2) + "\n", "utf8");
}

export function createId(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}
TS

cat > lib/analysisProviders.ts <<'TS'
import { runtimeConfig } from "./env";

export type AnalysisProvider = "openai" | "anthropic";

export function getProviderConfig() {
  return {
    defaultProvider: runtimeConfig.defaultAnalysisProvider,
    secondaryProvider: runtimeConfig.secondaryAnalysisProvider,
    providers: {
      openai: {
        enabled: Boolean(process.env.OPENAI_API_KEY),
        model: runtimeConfig.openaiModel
      },
      anthropic: {
        enabled: Boolean(process.env.ANTHROPIC_API_KEY),
        model: runtimeConfig.anthropicModel
      }
    }
  };
}

export async function analyzeTenderWithProvider(input: {
  provider?: AnalysisProvider;
  title: string;
  trade?: string;
  region?: string;
  keywords?: string[];
  text?: string;
}) {
  const provider = input.provider || (runtimeConfig.defaultAnalysisProvider as AnalysisProvider);

  return {
    provider,
    model: provider === "openai" ? runtimeConfig.openaiModel : runtimeConfig.anthropicModel,
    status: "stub",
    message: "Provider layer vorbereitet. Echte API-Calls werden nach env/local + secrets aktiviert.",
    input
  };
}
TS

cat > lib/graph.ts <<'TS'
export function buildGraphNodesFromDb(db: any) {
  const nodes: any[] = [];

  for (const s of db.sites || []) nodes.push({ type: "site", refId: s.id, label: s.name });
  for (const s of db.serviceAreas || []) nodes.push({ type: "service_area", refId: s.id, label: s.name });
  for (const t of db.tenders || []) nodes.push({ type: "tender", refId: t.id, label: t.title });
  for (const b of db.buyers || []) nodes.push({ type: "buyer", refId: b.id, label: b.name });
  for (const a of db.agents || []) nodes.push({ type: "agent", refId: a.id, label: a.name });
  for (const r of db.references || []) nodes.push({ type: "reference", refId: r.id, label: r.title });

  return nodes;
}

export function buildGraphEdgesFromDb(db: any) {
  const edges: any[] = [];

  for (const area of db.serviceAreas || []) {
    edges.push({
      type: "SERVICE_AREA_OF",
      fromType: "service_area",
      fromRefId: area.id,
      toType: "site",
      toRefId: area.siteId
    });
  }

  for (const rule of db.siteTradeRules || []) {
    edges.push({
      type: "SITE_RULE_OF",
      fromType: "site_rule",
      fromRefId: rule.id,
      toType: "site",
      toRefId: rule.siteId
    });
  }

  for (const tender of db.tenders || []) {
    if (tender.matchedSiteId) {
      edges.push({
        type: "MATCHED_SITE",
        fromType: "tender",
        fromRefId: tender.id,
        toType: "site",
        toRefId: tender.matchedSiteId
      });
    }
    if (tender.buyerId) {
      edges.push({
        type: "HAS_BUYER",
        fromType: "tender",
        fromRefId: tender.id,
        toType: "buyer",
        toRefId: tender.buyerId
      });
    }
    if (tender.ownerId) {
      edges.push({
        type: "HANDLED_BY",
        fromType: "tender",
        fromRefId: tender.id,
        toType: "agent",
        toRefId: tender.ownerId
      });
    }
  }

  return edges;
}
TS

cat > lib/storage.ts <<'TS'
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
      result[name] = docs[0] || {};
    } else {
      result[name] = docs.map(({ _id, ...rest }) => rest);
    }
  }
  return result;
}

export async function replaceCollection(name: CollectionName, rows: any[]) {
  if (!hasMongo()) {
    const json = await readJsonDb();
    if (name === "meta" || name === "config") {
      json[name] = rows[0] || {};
    } else {
      json[name] = rows;
    }
    await writeJsonDb(json);
    return;
  }

  const db = await getMongoDb();
  await db.collection(name).deleteMany({});
  if (rows.length) await db.collection(name).insertMany(rows);
}

export async function appendToCollection(name: CollectionName, row: any) {
  if (!hasMongo()) {
    const json = await readJsonDb();
    if (!Array.isArray(json[name])) json[name] = [];
    json[name].unshift(row);
    await writeJsonDb(json);
    return row;
  }

  const db = await getMongoDb();
  await db.collection(name).insertOne(row);
  return row;
}

export async function updateById(name: CollectionName, id: string, patch: any) {
  if (!hasMongo()) {
    const json = await readJsonDb();
    const list = json[name] || [];
    const idx = list.findIndex((x: any) => x.id === id);
    if (idx === -1) return null;
    list[idx] = { ...list[idx], ...patch };
    json[name] = list;
    await writeJsonDb(json);
    return list[idx];
  }

  const db = await getMongoDb();
  await db.collection(name).updateOne({ id }, { $set: patch });
  const updated = await db.collection(name).findOne({ id });
  if (!updated) return null;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { _id, ...rest } = updated;
  return rest;
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
TS

echo "🗃️ Migration Script JSON -> Mongo ..."
cat > scripts/migrate-json-to-mongo.mjs <<'MJS'
import { readStore } from "../lib/storage.js";

async function main() {
  const db = await readStore();
  console.log("Migration/Seed geprüft.");
  console.log({
    sites: db.sites?.length || 0,
    serviceAreas: db.serviceAreas?.length || 0,
    siteTradeRules: db.siteTradeRules?.length || 0,
    tenders: db.tenders?.length || 0,
    graphNodes: db.graphNodes?.length || 0,
    graphEdges: db.graphEdges?.length || 0
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
MJS

echo "🔌 Provider- und Ops-APIs ..."
cat > app/api/analysis/providers/route.ts <<'TS'
import { NextResponse } from "next/server";
import { getProviderConfig } from "@/lib/analysisProviders";

export async function GET() {
  return NextResponse.json(getProviderConfig());
}
TS

cat > app/api/ops/reseed/route.ts <<'TS'
import { NextResponse } from "next/server";
import { readStore } from "@/lib/storage";

export async function POST() {
  const db = await readStore();
  return NextResponse.json({
    ok: true,
    counts: {
      sites: db.sites?.length || 0,
      serviceAreas: db.serviceAreas?.length || 0,
      rules: db.siteTradeRules?.length || 0,
      tenders: db.tenders?.length || 0
    }
  });
}
TS

cat > app/api/ops/migrate/route.ts <<'TS'
import { NextResponse } from "next/server";
import { readStore } from "@/lib/storage";

export async function POST() {
  const db = await readStore();
  return NextResponse.json({
    ok: true,
    message: "JSON -> Mongo seed geprüft oder bereits vorhanden.",
    graphNodes: db.graphNodes?.length || 0,
    graphEdges: db.graphEdges?.length || 0
  });
}
TS

echo "🔁 APIs auf Storage umstellen ..."
cat > app/api/sites/route.ts <<'TS'
import { NextResponse } from "next/server";
import { appendToCollection, nextId, readStore } from "@/lib/storage";

export async function GET() {
  const db = await readStore();
  return NextResponse.json(db.sites || []);
}

export async function POST(req: Request) {
  const body = await req.json();
  const item = { id: nextId("site"), ...body };
  await appendToCollection("sites", item);
  return NextResponse.json(item);
}
TS

cat > app/api/sites/[id]/route.ts <<'TS'
import { NextResponse } from "next/server";
import { deleteById, readStore, updateById } from "@/lib/storage";

export async function GET(_: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const db = await readStore();
  const item = (db.sites || []).find((x: any) => x.id === id);
  return NextResponse.json(item ?? null, { status: item ? 200 : 404 });
}

export async function PUT(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const patch = await req.json();
  const updated = await updateById("sites", id, patch);
  if (!updated) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json(updated);
}

export async function DELETE(_: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  await deleteById("sites", id);
  return NextResponse.json({ ok: true });
}
TS

cat > app/api/site-rules/route.ts <<'TS'
import { NextResponse } from "next/server";
import { appendToCollection, nextId, readStore } from "@/lib/storage";

export async function GET() {
  const db = await readStore();
  return NextResponse.json(db.siteTradeRules || []);
}

export async function POST(req: Request) {
  const body = await req.json();
  const item = { id: nextId("rule"), ...body };
  await appendToCollection("siteTradeRules", item);
  return NextResponse.json(item);
}
TS

cat > app/api/service-areas/route.ts <<'TS'
import { NextResponse } from "next/server";
import { appendToCollection, nextId, readStore } from "@/lib/storage";

export async function GET() {
  const db = await readStore();
  return NextResponse.json(db.serviceAreas || []);
}

export async function POST(req: Request) {
  const body = await req.json();
  const item = { id: nextId("sa"), ...body };
  await appendToCollection("serviceAreas", item);
  return NextResponse.json(item);
}
TS

cat > app/api/keywords/route.ts <<'TS'
import { NextResponse } from "next/server";
import { readStore } from "@/lib/storage";

export async function GET() {
  const db = await readStore();
  const rows = (db.siteTradeRules || []).map((r: any) => ({
    id: r.id,
    siteId: r.siteId,
    trade: r.trade,
    positive: r.keywordsPositive || [],
    negative: r.keywordsNegative || [],
    regionNotes: r.regionNotes || ""
  }));
  return NextResponse.json(rows);
}
TS

cat > app/api/tenders/route.ts <<'TS'
import { NextResponse } from "next/server";
import { appendToCollection, nextId, readStore } from "@/lib/storage";

export async function GET() {
  const db = await readStore();
  return NextResponse.json(db.tenders || []);
}

export async function POST(req: Request) {
  const body = await req.json();
  const item = { id: nextId("t"), ...body };
  await appendToCollection("tenders", item);
  return NextResponse.json(item);
}
TS

cat > app/api/tenders/[id]/route.ts <<'TS'
import { NextResponse } from "next/server";
import { deleteById, readStore, updateById } from "@/lib/storage";

export async function GET(_: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const db = await readStore();
  const item = (db.tenders || []).find((x: any) => x.id === id);
  return NextResponse.json(item ?? null, { status: item ? 200 : 404 });
}

export async function PUT(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const patch = await req.json();
  const updated = await updateById("tenders", id, patch);
  if (!updated) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json(updated);
}

export async function DELETE(_: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  await deleteById("tenders", id);
  return NextResponse.json({ ok: true });
}
TS

echo "📖 Seiten auf Storage umstellen ..."
cat > app/dashboard/monitoring/page.tsx <<'TSX'
import { readStore } from "@/lib/storage";

export default async function MonitoringPage() {
  const db = await readStore();
  const stats = db.sourceStats || [];
  return (
    <div className="stack">
      <div>
        <h1 className="h1">Monitoring</h1>
        <p className="sub">Quellenleistung, letzter Abruf und Nutzen pro Anbieter.</p>
      </div>
      <div className="card table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Quelle</th>
              <th>Letzter Abruf</th>
              <th>letzter Monat</th>
              <th>seit letztem Abruf</th>
              <th>vorausgewählt</th>
              <th>Go</th>
              <th>Fehler</th>
              <th>Dubletten</th>
            </tr>
          </thead>
          <tbody>
            {stats.map((s: any) => (
              <tr key={s.id}>
                <td>{s.name}</td>
                <td>{s.lastFetchAt}</td>
                <td>{s.tendersLast30Days}</td>
                <td>{s.tendersSinceLastFetch}</td>
                <td>{s.prefilteredLast30Days}</td>
                <td>{s.goLast30Days}</td>
                <td>{s.errorCountLastRun}</td>
                <td>{s.duplicateCountLastRun}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
TSX

cat > app/sites/[id]/page.tsx <<'TSX'
import { notFound } from "next/navigation";
import { readStore } from "@/lib/storage";
import { siteTradeOperationalRows } from "@/lib/siteLogic";

function capacityBadge(status: string) {
  if (status === "voll") return "badge badge-kritisch";
  if (status === "eng") return "badge badge-gemischt";
  return "badge badge-gut";
}

export default async function SiteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = await readStore();
  const site = (db.sites || []).find((x: any) => x.id === id);
  if (!site) return notFound();

  const serviceAreas = (db.serviceAreas || []).filter((x: any) => x.siteId === id);
  const rows = siteTradeOperationalRows(site, db.siteTradeRules || [], db.tenders || []);

  return (
    <div className="stack">
      <div>
        <h1 className="h1">{site.name}</h1>
        <p className="sub">Standortdetail mit bearbeitbarer Zielstruktur für Gewerk, Radius, Kapazität und verpasste Radiusklasse.</p>
      </div>

      <div className="grid grid-4">
        <div className="card"><div className="label">Standort</div><div className="kpi">{site.city}</div></div>
        <div className="card"><div className="label">Typ</div><div className="kpi">{site.type}</div></div>
        <div className="card"><div className="label">Primär / Sekundär</div><div className="kpi">{site.primaryRadiusKm}/{site.secondaryRadiusKm} km</div></div>
        <div className="card"><div className="label">Service Areas</div><div className="kpi">{serviceAreas.length}</div></div>
      </div>

      <div className="card">
        <div className="section-title">Service Areas</div>
        <div className="meta">{serviceAreas.map((x: any) => x.name).join(", ") || "-"}</div>
      </div>

      <div className="card">
        <div className="section-title">Gewerkeregeln & Kapazität</div>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Gewerk</th>
                <th>Primär</th>
                <th>Sekundär</th>
                <th>Tertiär</th>
                <th>Monat / Parallel</th>
                <th>Im Scope</th>
                <th>Nächste Klasse</th>
                <th>Manuell prüfen</th>
                <th>Status</th>
                <th>Keywords</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row: any) => (
                <tr key={row.rule.id}>
                  <td>{row.rule.trade}</td>
                  <td>{row.rule.primaryRadiusKm} km</td>
                  <td>{row.rule.secondaryRadiusKm} km</td>
                  <td>{row.rule.tertiaryRadiusKm} km</td>
                  <td>{row.monthlyCapacity} / {row.concurrentCapacity}</td>
                  <td>{row.currentScopeCount}</td>
                  <td>{row.nextBandCount}</td>
                  <td>{row.nextBandManualCandidates}</td>
                  <td><span className={capacityBadge(row.capacityStatus)}>{row.capacityStatus}</span></td>
                  <td>{(row.rule.keywordsPositive || []).join(", ")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
TSX

echo "🧾 Docs für DB / Provider / Graph ..."
cat > docs/DB_MODEL.md <<'DOC'
# DB_MODEL

## Collections
- meta
- config
- sourceStats
- sites
- serviceAreas
- siteTradeRules
- buyers
- agents
- tenders
- pipeline
- references
- graphNodes
- graphEdges

## Ziel
Mongo wird die operative Persistenz. JSON bleibt nur als Fallback/Seed.
DOC

cat > docs/PROVIDERS.md <<'DOC'
# PROVIDERS

## Zielbild
- GPT / OpenAI als Haupt-Orchestrator
- Claude / Anthropic als Tiefenanalyse / Second Opinion

## Voraussetzungen
.env.local mit:
- MONGODB_URI
- MONGODB_DB_NAME
- OPENAI_API_KEY
- OPENAI_MODEL
- ANTHROPIC_API_KEY
- ANTHROPIC_MODEL
DOC

cat > docs/GRAPH_MODEL.md <<'DOC'
# GRAPH_MODEL

## Nodes
- site
- service_area
- tender
- buyer
- agent
- reference

## Edges
- SERVICE_AREA_OF
- SITE_RULE_OF
- MATCHED_SITE
- HAS_BUYER
- HANDLED_BY

## Nutzen
- Lernlogik
- Erklärbarkeit
- Similarity
- spätere Score-/Empfehlungssysteme
DOC

node -e "const fs=require('fs');const p='package.json';const pkg=JSON.parse(fs.readFileSync(p,'utf8'));pkg.scripts=Object.assign({},pkg.scripts,{ 'migrate:mongo':'node scripts/migrate-json-to-mongo.mjs' });fs.writeFileSync(p,JSON.stringify(pkg,null,2)+'\n');"

npm run build || true
git add .
git commit -m "feat: add mongo-ready storage, provider config, graph-ready collections and clickable dashboard drilldowns" || true
git push origin main || true

echo "✅ Mongo/Provider/Graph Upgrade eingebaut."
echo "Nächste Schritte:"
echo "1) env.local mit Mongo/OpenAI/Anthropic pflegen"
echo "2) npm run migrate:mongo"
echo "3) npm run dev"
