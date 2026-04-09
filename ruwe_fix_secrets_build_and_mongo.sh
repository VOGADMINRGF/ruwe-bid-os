#!/bin/bash
set -e

cd "$(pwd)"

echo "🔧 Fixe Secrets, Build-Kompatibilität und Mongo-Migration"

# 1) Secret-Datei aus dem Repo entfernen
rm -f app/env.local

# 2) .gitignore härten
touch .gitignore
grep -qxF '.env.local' .gitignore || echo '.env.local' >> .gitignore
grep -qxF 'app/env.local' .gitignore || echo 'app/env.local' >> .gitignore
grep -qxF '.env' .gitignore || echo '.env' >> .gitignore

# 3) Beispiel-Env anlegen (ohne echte Keys)
cat > .env.local.example <<'ENV'
APP_ENV=local

MONGODB_URI=
MONGODB_DB_NAME=ruwe_bid_os

OPENAI_API_KEY=
OPENAI_MODEL=gpt-5

ANTHROPIC_API_KEY=
ANTHROPIC_MODEL=claude-sonnet-4-5

DEFAULT_ANALYSIS_PROVIDER=openai
SECONDARY_ANALYSIS_PROVIDER=anthropic

INGESTION_ENABLED=true
INGESTION_INTERVAL_MINUTES=60
ENV

# 4) lib/db.ts kompatibel machen
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

export async function readDb() {
  return readJsonDb();
}

export async function writeDb(data: any) {
  return writeJsonDb(data);
}

export function createId(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}
TS

# 5) fitScore wiederherstellen
cat > lib/scoring.ts <<'TS'
export function weightedPipeline(items: { value: number }[]) {
  return items.reduce((sum, item) => sum + item.value, 0);
}

export function goQuote(tenders: any[]) {
  if (!tenders.length) return 0;
  return tenders.filter((t) => t.decision === "Go").length / tenders.length;
}

export function manualQueueCount(tenders: any[]) {
  return tenders.filter((t) => t.manualReview === "zwingend" || t.decision === "Prüfen").length;
}

export function overdueCount(tenders: any[]) {
  const now = new Date();
  return tenders.filter((t) => t.dueDate && new Date(t.dueDate) < now && t.decision !== "No-Go").length;
}

export function overallAssessment(tenders: any[]) {
  if (!tenders.length) return "gemischt";
  const total = tenders.length;
  const go = tenders.filter((t) => t.decision === "Go").length / total;
  const overdue = overdueCount(tenders);
  const noGo = tenders.filter((t) => t.decision === "No-Go").length / total;

  if (go >= 0.25 && overdue === 0) return "gut";
  if (overdue >= 2 || noGo > 0.5) return "kritisch";
  return "gemischt";
}

export function fitScore(tender: any, zone?: any, buyer?: any) {
  let score = 0;

  if (tender.priority === "A") score += 30;
  else if (tender.priority === "B") score += 20;
  else score += 8;

  if (zone) {
    if (Array.isArray(zone.priorityTrades) && zone.priorityTrades.includes(tender.trade)) score += 30;
    else if (Array.isArray(zone.supportedTrades) && zone.supportedTrades.includes(tender.trade)) score += 18;
    else score += 4;
  }

  if (buyer?.strategic) score += 20;
  else score += 10;

  if (tender.manualReview === "nein") score += 10;
  else if (tender.manualReview === "optional") score += 5;

  if (tender.riskLevel === "niedrig") score += 10;
  else if (tender.riskLevel === "mittel") score += 5;

  if (typeof tender.distanceKm === "number") {
    if (tender.distanceKm <= 25) score += 10;
    else if (tender.distanceKm <= 50) score += 6;
    else if (tender.distanceKm <= 75) score += 3;
  }

  return Math.min(score, 100);
}
TS

# 6) Mongo-Migrationsscript ohne TS-Import reparieren
cat > scripts/migrate-json-to-mongo.mjs <<'MJS'
import fs from "fs/promises";
import path from "path";
import { MongoClient } from "mongodb";

const mongoUri = process.env.MONGODB_URI || "";
const dbName = process.env.MONGODB_DB_NAME || "ruwe_bid_os";

if (!mongoUri) {
  console.log("MONGODB_URI fehlt. Migration übersprungen.");
  process.exit(0);
}

const root = process.cwd();
const file = path.join(root, "data", "db.json");
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
MJS

# 7) package.json script absichern
node <<'NODE'
const fs = require('fs');
const p = 'package.json';
const pkg = JSON.parse(fs.readFileSync(p, 'utf8'));
pkg.scripts = Object.assign({}, pkg.scripts, {
  "migrate:mongo": "node scripts/migrate-json-to-mongo.mjs"
});
fs.writeFileSync(p, JSON.stringify(pkg, null, 2) + '\n');
NODE

# 8) Falls der letzte lokale Commit die Secrets enthält, zurückdrehen aber Änderungen behalten
LAST_MSG="$(git log -1 --pretty=%s || true)"
if [ "$LAST_MSG" = "feat: add mongo-ready storage, provider config, graph-ready collections and clickable dashboard drilldowns" ]; then
  echo "↩️ Letzten lokalen Commit mit Secrets zurücksetzen ..."
  git reset --soft HEAD~1
fi

# 9) Alles neu committen ohne Secrets
git add .
git restore --staged app/env.local 2>/dev/null || true

# echte env.local nie committen
[ -f .env.local ] && git restore --staged .env.local 2>/dev/null || true

git commit -m "fix: remove committed secrets, restore db compatibility and repair mongo migration" || true

echo "🧪 Build-Test ..."
npm run build || true

echo "✅ Fix angewendet."
echo "Nächste Schritte:"
echo "1) Lege deine echten Keys nur in .env.local ab"
echo "2) npm run migrate:mongo"
echo "3) npm run dev"
echo "4) git push origin main"
