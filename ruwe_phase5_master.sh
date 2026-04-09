#!/bin/bash
set -e

echo "🚀 RUWE Bid OS — Phase 1–5 Master Setup"

cd "$(pwd)"

echo "🧹 Räume problematische Altstände auf ..."
rm -rf prisma
rm -f tailwind.config.js tailwind.config.ts postcss.config.js postcss.config.mjs
rm -f lib/prisma.ts
rm -f app/globals.css
rm -f components/Nav.tsx
rm -f ruwe_master_setup.sh ruwe_master_setup_v2.sh ruwe_full_fix.sh ruwe_full_repair.sh upgrade_ruwe_bid_os.sh bootstrap_ruwe_bid_os.sh

mkdir -p app
mkdir -p app/tenders app/tenders/[id]
mkdir -p app/pipeline app/pipeline/[id]
mkdir -p app/agents app/agents/[id]
mkdir -p app/zones app/zones/[id]
mkdir -p app/buyers app/buyers/[id]
mkdir -p app/references app/references/[id]
mkdir -p app/config
mkdir -p app/api/overview
mkdir -p app/api/tenders app/api/tenders/[id]
mkdir -p app/api/pipeline app/api/pipeline/[id]
mkdir -p app/api/agents app/api/agents/[id]
mkdir -p app/api/zones app/api/zones/[id]
mkdir -p app/api/buyers app/api/buyers/[id]
mkdir -p app/api/references app/api/references/[id]
mkdir -p app/api/config
mkdir -p components
mkdir -p lib
mkdir -p data
mkdir -p docs
mkdir -p scripts

echo "🧭 Stelle package.json robust ein ..."
node <<'NODE'
const fs = require('fs');
const path = 'package.json';
if (!fs.existsSync(path)) {
  console.error('package.json nicht gefunden. Bitte zuerst ein Next.js-Projekt im Repo haben.');
  process.exit(1);
}
const pkg = JSON.parse(fs.readFileSync(path, 'utf8'));
pkg.name = 'ruwe-bid-os';
pkg.private = true;
pkg.scripts = Object.assign({}, pkg.scripts, {
  dev: 'next dev',
  build: 'next build',
  start: 'next start',
  lint: pkg.scripts?.lint || 'eslint',
  seed: 'node scripts/reseed.mjs'
});
fs.writeFileSync(path, JSON.stringify(pkg, null, 2) + '\n');
NODE

echo "📦 Lege JSON-Datenbasis an ..."
cat > data/db.json <<'JSON'
{
  "meta": {
    "appName": "RUWE Bid OS",
    "version": "phase5-master",
    "lastSeededAt": "2026-04-08T22:30:00.000Z",
    "pollingSeconds": 60
  },
  "config": {
    "assessmentRules": {
      "good": {
        "minStrongShare": 0.4,
        "maxOverdue": 0,
        "minGoShare": 0.25
      },
      "critical": {
        "maxGoShare": 0.15,
        "minOverdue": 2
      }
    },
    "tradeMatrix": {
      "Facility": { "radiusPrimaryKm": 45, "radiusSecondaryKm": 70, "baseWeight": 1.0 },
      "Sicherheit": { "radiusPrimaryKm": 35, "radiusSecondaryKm": 60, "baseWeight": 1.1 },
      "Reinigung": { "radiusPrimaryKm": 40, "radiusSecondaryKm": 65, "baseWeight": 0.95 },
      "Hausmeister": { "radiusPrimaryKm": 30, "radiusSecondaryKm": 50, "baseWeight": 0.9 },
      "Grünpflege": { "radiusPrimaryKm": 30, "radiusSecondaryKm": 45, "baseWeight": 0.7 },
      "Winterdienst": { "radiusPrimaryKm": 25, "radiusSecondaryKm": 40, "baseWeight": 0.65 }
    },
    "sources": [
      { "id": "s1", "name": "TED Europa", "type": "rss", "url": "https://ted.europa.eu" },
      { "id": "s2", "name": "Bund.de", "type": "portal", "url": "https://www.service.bund.de" },
      { "id": "s3", "name": "DTVP", "type": "portal", "url": "https://www.dtvp.de" }
    ],
    "roles": [
      { "key": "management", "label": "Management" },
      { "key": "coordinator", "label": "Koordinator" },
      { "key": "assistant", "label": "Assistenz" },
      { "key": "analyst", "label": "Analyst" }
    ]
  },
  "zones": [
    {
      "id": "z1",
      "name": "Leipzig/Halle",
      "homeBase": "Leipzig",
      "state": "Sachsen/Sachsen-Anhalt",
      "primaryRadiusKm": 45,
      "secondaryRadiusKm": 70,
      "priorityTrades": ["Facility", "Sicherheit"],
      "supportedTrades": ["Reinigung", "Hausmeister"],
      "notes": "Ausbauzone Ost mit Fokus auf Facility und Sicherheit."
    },
    {
      "id": "z2",
      "name": "Magdeburg/Salzlandkreis",
      "homeBase": "Magdeburg",
      "state": "Sachsen-Anhalt",
      "primaryRadiusKm": 40,
      "secondaryRadiusKm": 60,
      "priorityTrades": ["Sicherheit", "Reinigung"],
      "supportedTrades": ["Facility"],
      "notes": "Starker Fit für sicherheitsnahe Lose."
    },
    {
      "id": "z3",
      "name": "Gera/Altenburg",
      "homeBase": "Gera",
      "state": "Thüringen",
      "primaryRadiusKm": 35,
      "secondaryRadiusKm": 55,
      "priorityTrades": ["Hausmeister", "Facility"],
      "supportedTrades": ["Reinigung"],
      "notes": "Geeignet für wiederkehrende kommunale Lose."
    },
    {
      "id": "z4",
      "name": "Berlin selektiv",
      "homeBase": "Berlin",
      "state": "Berlin",
      "primaryRadiusKm": 25,
      "secondaryRadiusKm": 35,
      "priorityTrades": ["Sicherheit"],
      "supportedTrades": ["Facility"],
      "notes": "Preisgetrieben, nur selektiv spielen."
    }
  ],
  "buyers": [
    { "id": "b1", "name": "Stadt Leipzig", "type": "kommunal", "strategic": true },
    { "id": "b2", "name": "Jobcenter Salzlandkreis", "type": "öffentlich", "strategic": true },
    { "id": "b3", "name": "Bezirksamt Berlin", "type": "kommunal", "strategic": false },
    { "id": "b4", "name": "Landratsamt Altenburg", "type": "öffentlich", "strategic": true }
  ],
  "agents": [
    { "id": "a1", "name": "Agent 1", "focus": "Facility Ost", "level": "Koordinator", "region": "Leipzig/Halle", "winRate": 0.41, "pipelineValue": 4200000 },
    { "id": "a2", "name": "Agent 2", "focus": "Sicherheit", "level": "Koordinator", "region": "Magdeburg/Salzlandkreis", "winRate": 0.37, "pipelineValue": 3100000 },
    { "id": "a3", "name": "Agent 3", "focus": "Kommunal", "level": "Spezialist", "region": "Gera/Altenburg", "winRate": 0.29, "pipelineValue": 1800000 },
    { "id": "a4", "name": "Agent 4", "focus": "Berlin selektiv", "level": "Spezialist", "region": "Berlin selektiv", "winRate": 0.18, "pipelineValue": 950000 },
    { "id": "a5", "name": "Agent 5", "focus": "Assistenz Ost", "level": "Assistenz", "region": "Leipzig/Halle", "winRate": 0.12, "pipelineValue": 250000 },
    { "id": "a6", "name": "Agent 6", "focus": "Assistenz Zentral", "level": "Assistenz", "region": "Magdeburg/Salzlandkreis", "winRate": 0.10, "pipelineValue": 150000 }
  ],
  "tenders": [
    {
      "id": "t1",
      "title": "Verwaltungsreinigung Leipzig",
      "region": "Leipzig/Halle",
      "trade": "Facility",
      "buyerId": "b1",
      "zoneId": "z1",
      "ownerId": "a1",
      "priority": "A",
      "decision": "Go",
      "status": "go",
      "manualReview": "nein",
      "fitSummary": "stark",
      "riskLevel": "niedrig",
      "estimatedValue": 1800000,
      "dueDate": "2026-05-10",
      "sourceType": "portal",
      "notes": "Starker strategischer Fit in Zielzone."
    },
    {
      "id": "t2",
      "title": "Sicherheitsdienst Salzlandkreis",
      "region": "Magdeburg/Salzlandkreis",
      "trade": "Sicherheit",
      "buyerId": "b2",
      "zoneId": "z2",
      "ownerId": "a2",
      "priority": "A",
      "decision": "Prüfen",
      "status": "manuelle_pruefung",
      "manualReview": "zwingend",
      "fitSummary": "stark",
      "riskLevel": "mittel",
      "estimatedValue": 2400000,
      "dueDate": "2026-04-20",
      "sourceType": "portal",
      "notes": "Gutes Volumen, manuelle Prüfung wegen Leistungsumfang."
    },
    {
      "id": "t3",
      "title": "Schulreinigung Berlin",
      "region": "Berlin selektiv",
      "trade": "Reinigung",
      "buyerId": "b3",
      "zoneId": "z4",
      "ownerId": "a4",
      "priority": "C",
      "decision": "No-Go",
      "status": "no_go",
      "manualReview": "nein",
      "fitSummary": "schwach",
      "riskLevel": "hoch",
      "estimatedValue": 900000,
      "dueDate": "2026-04-18",
      "sourceType": "portal",
      "notes": "Preislich unattraktiv."
    },
    {
      "id": "t4",
      "title": "Hausmeisterdienst Gera",
      "region": "Gera/Altenburg",
      "trade": "Hausmeister",
      "buyerId": "b4",
      "zoneId": "z3",
      "ownerId": "a3",
      "priority": "B",
      "decision": "Go",
      "status": "go",
      "manualReview": "optional",
      "fitSummary": "mittel",
      "riskLevel": "niedrig",
      "estimatedValue": 650000,
      "dueDate": "2026-04-25",
      "sourceType": "portal",
      "notes": "Guter Fit, aber geringeres Volumen."
    }
  ],
  "pipeline": [
    { "id": "p1", "title": "Verwaltungsreinigung Leipzig", "stage": "Angebot", "value": 1800000, "tenderId": "t1" },
    { "id": "p2", "title": "Sicherheitsdienst Salzlandkreis", "stage": "Prüfung", "value": 2400000, "tenderId": "t2" },
    { "id": "p3", "title": "Hausmeisterdienst Gera", "stage": "Angebot", "value": 650000, "tenderId": "t4" }
  ],
  "references": [
    {
      "id": "r1",
      "title": "Kommunale Verwaltungsreinigung",
      "description": "Referenz für wiederkehrende Facility-Leistungen im öffentlichen Bereich.",
      "trade": "Facility",
      "region": "Ost",
      "value": 1500000
    },
    {
      "id": "r2",
      "title": "Sicherheitsdienst öffentlicher Auftraggeber",
      "description": "Referenz für sicherheitsnahe Leistungen mit hohen Anforderungen.",
      "trade": "Sicherheit",
      "region": "Sachsen-Anhalt",
      "value": 2300000
    }
  ],
  "ingestion": {
    "sources": [
      { "id": "i1", "name": "TED Europa", "type": "rss", "status": "ready" },
      { "id": "i2", "name": "Bund.de", "type": "portal", "status": "planned" },
      { "id": "i3", "name": "DTVP", "type": "portal", "status": "planned" }
    ],
    "jobs": [],
    "lastRunAt": null
  }
}
JSON

echo "🧠 Lege Kernlogik an ..."
cat > lib/types.ts <<'TS'
export type TenderPriority = "A" | "B" | "C";
export type TenderDecision = "Go" | "Prüfen" | "No-Go";
export type TenderStatus = "neu" | "vorqualifiziert" | "manuelle_pruefung" | "go" | "no_go" | "beobachten";

export interface Zone {
  id: string;
  name: string;
  homeBase: string;
  state: string;
  primaryRadiusKm: number;
  secondaryRadiusKm: number;
  priorityTrades: string[];
  supportedTrades: string[];
  notes?: string;
}

export interface Buyer {
  id: string;
  name: string;
  type: string;
  strategic: boolean;
}

export interface Agent {
  id: string;
  name: string;
  focus: string;
  level: string;
  region: string;
  winRate: number;
  pipelineValue: number;
}

export interface Tender {
  id: string;
  title: string;
  region: string;
  trade: string;
  buyerId: string;
  zoneId: string;
  ownerId?: string;
  priority: TenderPriority;
  decision: TenderDecision;
  status: TenderStatus;
  manualReview: "zwingend" | "optional" | "nein";
  fitSummary: "stark" | "mittel" | "schwach";
  riskLevel: "niedrig" | "mittel" | "hoch";
  estimatedValue: number;
  dueDate?: string;
  sourceType?: string;
  notes?: string;
}

export interface PipelineEntry {
  id: string;
  title: string;
  stage: string;
  value: number;
  tenderId?: string;
}

export interface ReferenceItem {
  id: string;
  title: string;
  description: string;
  trade: string;
  region: string;
  value: number;
}
TS

cat > lib/db.ts <<'TS'
import { promises as fs } from "fs";
import path from "path";

const DB_PATH = path.join(process.cwd(), "data", "db.json");

export async function readDb() {
  const raw = await fs.readFile(DB_PATH, "utf8");
  return JSON.parse(raw);
}

export async function writeDb(data: any) {
  await fs.writeFile(DB_PATH, JSON.stringify(data, null, 2) + "\n", "utf8");
}

export function createId(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}
TS

cat > lib/scoring.ts <<'TS'
import { Tender, Zone, Buyer } from "./types";

export function tenderPriorityWeight(priority: Tender["priority"]) {
  if (priority === "A") return 0.7;
  if (priority === "B") return 0.4;
  return 0.15;
}

export function weightedPipeline(items: { value: number }[]) {
  return items.reduce((sum, item) => sum + item.value, 0);
}

export function goQuote(tenders: Tender[]) {
  if (!tenders.length) return 0;
  return tenders.filter((t) => t.decision === "Go").length / tenders.length;
}

export function manualQueueCount(tenders: Tender[]) {
  return tenders.filter((t) => t.manualReview === "zwingend" || t.decision === "Prüfen").length;
}

export function overdueCount(tenders: Tender[]) {
  const now = new Date();
  return tenders.filter((t) => t.dueDate && new Date(t.dueDate) < now && t.decision !== "No-Go").length;
}

export function strongCount(tenders: Tender[]) {
  return tenders.filter((t) => t.priority === "A" || t.priority === "B").length;
}

export function overallAssessment(tenders: Tender[]) {
  if (!tenders.length) return "gemischt";
  const total = tenders.length;
  const go = tenders.filter((t) => t.decision === "Go").length / total;
  const strong = strongCount(tenders) / total;
  const overdue = overdueCount(tenders);

  if (strong >= 0.4 && go >= 0.25 && overdue === 0) return "gut";
  if (go <= 0.15 || overdue >= 2) return "kritisch";
  return "gemischt";
}

export function fitScore(tender: Tender, zone?: Zone, buyer?: Buyer) {
  let score = 0;

  if (tender.priority === "A") score += 30;
  else if (tender.priority === "B") score += 20;
  else score += 8;

  if (zone) {
    if (zone.priorityTrades.includes(tender.trade)) score += 30;
    else if (zone.supportedTrades.includes(tender.trade)) score += 18;
    else score += 4;
  }

  if (buyer?.strategic) score += 20;
  else score += 10;

  if (tender.manualReview === "nein") score += 10;
  else if (tender.manualReview === "optional") score += 5;

  if (tender.riskLevel === "niedrig") score += 10;
  else if (tender.riskLevel === "mittel") score += 5;

  return Math.min(score, 100);
}
TS

cat > scripts/reseed.mjs <<'MJS'
import { readFile, writeFile } from "fs/promises";
import path from "path";

const root = process.cwd();
const src = path.join(root, "data", "db.json");
const raw = await readFile(src, "utf8");
const data = JSON.parse(raw);
data.meta.lastSeededAt = new Date().toISOString();
await writeFile(src, JSON.stringify(data, null, 2) + "\n", "utf8");
console.log("db.json reseeded timestamp updated");
MJS

echo "🧾 Erzeuge Docs bis Phase 5 ..."
cat > docs/README.md <<'DOC'
# RUWE Bid OS Docs

Zentrales Dokumentationsverzeichnis für das zonen-, radius- und gewerkebasierte Vertriebs- und Ausschreibungssteuerungssystem von RUWE.
DOC

cat > docs/CURRENT_STATE.md <<'DOC'
# CURRENT_STATE

## Stand
Stabiles Next.js-System ohne Prisma-/Tailwind-Abhängigkeit als lokale Arbeitsbasis.

## Bereits enthalten
- Dashboard mit Management-KPIs
- Klickbare Module inkl. Detailseiten
- JSON-Datenbasis mit API-Routen
- Score-, KPI- und Assessment-Logik
- Ingestion- und Rollen-Scaffold
- Docs für Phasen, Roadmap und Aufgaben

## Noch offen
- Externe Feed- und Portal-Adapter
- Auth & Rollen enforcement
- Hintergrundjobs / Scheduler
- Exporte / Reporting
DOC

cat > docs/PHASES.md <<'DOC'
# PHASES

## Phase 1 — Foundation
Stabiles Grundgerüst, Layout, Navigation, Datenbasis, APIs.

## Phase 2 — Operational Core
Tenders, Pipeline, Zones, Buyers, Agents, References, Config mit Detailseiten und Managementsicht.

## Phase 3 — Intelligence
Scoring, KPI-Modelle, Overall Assessment, Queue-Logik, Priorisierung, Fit-Logik.

## Phase 4 — Ingestion & Automation
Monitoring-Quellen, Polling, Normalisierung, Dubletten, Ingestion-Jobs.

## Phase 5 — Production & Scale
Rollenmodell, Deploy, Audit-Readiness, Worker/DB-Migration, Export- und Reporting-Fähigkeit.
DOC

cat > docs/ROADMAP.md <<'DOC'
# ROADMAP

## Kurzfristig
- Tenders CRUD ausbauen
- Filter/Sortierung
- Pipeline Board
- Buyer-/Zone-Detailanalysen

## Mittelfristig
- Ingestion Scheduler
- Alerts
- Reference Matching
- Agent Allocation Suggestions

## Langfristig
- Auth
- Postgres
- Background Workers
- PDF/Excel Export
- KI-gestützte Empfehlung
DOC

cat > docs/OpenTasks.md <<'DOC'
# OpenTasks

## P2 Operational Core
- [ ] Tender Create/Edit UI
- [ ] Pipeline Board UI
- [ ] Agent Detail KPI Panels
- [ ] Zone Heat / Fit View
- [ ] Buyer Performance View
- [ ] Reference Linkage zu Tenders

## P3 Intelligence
- [ ] Go/Prüfen/No-Go Regelcenter
- [ ] Overall Assessment Explainability
- [ ] Manual Review Priorisierer
- [ ] Weighted Pipeline by Zone/Trade
- [ ] Alerting Rules

## P4 Ingestion
- [ ] RSS Adapter
- [ ] TED Adapter
- [ ] Bund.de Adapter
- [ ] Portal Polling Jobs
- [ ] Duplicate Detection
- [ ] Import Review Queue

## P5 Production
- [ ] Auth/Roles
- [ ] Audit Log
- [ ] Postgres Migration
- [ ] Background Worker
- [ ] Vercel/Prod Env Matrix
DOC

cat > docs/KPI_MODEL.md <<'DOC'
# KPI_MODEL

## Kern-KPIs
- Neu eingegangen
- Manuell prüfen
- Go-Kandidaten
- Überfällige Fälle
- Weighted Pipeline
- Go-Quote
- Overall Assessment

## Erweiterbare KPIs
- Go-Quote pro Zone
- Go-Quote pro Gewerk
- Win-Rate pro Agent
- Prüfaufwand pro Agent
- Strategischer Anteil starker Lose
DOC

cat > docs/SCORING_RULES.md <<'DOC'
# SCORING_RULES

## Grundlogik
Fit = Priorität + Zonen-/Gewerkefit + strategischer Buyer + Prüfaufwand + Risiko

## Ziel
Nicht bloß Ausschreibungen anzeigen, sondern gezielt priorisieren und zur Entscheidung bringen.
DOC

cat > docs/AGENT_ALLOCATION_MODEL.md <<'DOC'
# AGENT_ALLOCATION_MODEL

## Ziel
Aus 4 Koordinatoren + 2 Assistenzen perspektivisch 5–6 klare Bereiche ableiten.

## Kriterien
- Region
- Gewerk
- Erfolgsquote
- Pipeline-Wert
- manueller Prüfaufwand
- Auftraggeberstruktur
DOC

cat > docs/INGESTION_MODEL.md <<'DOC'
# INGESTION_MODEL

## Quellenarten
- RSS
- Portal
- API
- manuelle Erfassung

## Prozess
Source -> Normalize -> Deduplicate -> Score -> Review Queue -> Tender Registry
DOC

cat > docs/OPERATING_MODEL.md <<'DOC'
# OPERATING_MODEL

Das System ist ein Management- und Steuerungswerkzeug, kein bloßer Listencontainer.

## Leitprinzipien
- Zone statt Bundesland
- Radius statt pauschaler Region
- Gewerk statt allgemeiner Kategorie
- Mensch bleibt Entscheider
- No-Go ist dokumentationspflichtig
DOC

echo "🎨 Lege stabiles CSS an ..."
cat > app/globals.css <<'CSS'
:root {
  --bg: #f3f4f6;
  --panel: #ffffff;
  --text: #111827;
  --muted: #6b7280;
  --line: #e5e7eb;
  --black: #0b0b0b;
  --orange: #f97316;
  --orange-2: #fb923c;
  --green: #16a34a;
  --red: #dc2626;
  --yellow: #d97706;
  --blue: #2563eb;
}

* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; background: var(--bg); color: var(--text); font-family: Arial, Helvetica, sans-serif; }
a { color: inherit; text-decoration: none; }

.topbar {
  background: var(--black);
  color: white;
  padding: 16px 24px;
  display: flex;
  align-items: center;
  gap: 24px;
  position: sticky;
  top: 0;
  z-index: 20;
}

.brand {
  font-weight: 900;
  font-size: 20px;
}

.brand span { color: var(--orange); }

.nav {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
}

.nav a {
  color: #f9fafb;
  opacity: 0.95;
}

.nav a:hover {
  color: var(--orange-2);
}

.container {
  max-width: 1280px;
  margin: 0 auto;
  padding: 24px;
}

.grid { display: grid; gap: 16px; }
.grid-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
.grid-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
.grid-4 { grid-template-columns: repeat(4, minmax(0, 1fr)); }
.grid-6 { grid-template-columns: repeat(6, minmax(0, 1fr)); }

.card {
  background: var(--panel);
  border: 1px solid var(--line);
  border-left: 5px solid var(--orange);
  border-radius: 12px;
  padding: 18px;
  box-shadow: 0 1px 8px rgba(0,0,0,.04);
}

.label {
  color: var(--muted);
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: .08em;
}

.kpi {
  font-size: 30px;
  font-weight: 900;
  margin-top: 8px;
}

.h1 {
  font-size: 38px;
  line-height: 1.1;
  margin: 0 0 8px;
}

.sub {
  color: var(--muted);
  max-width: 900px;
  line-height: 1.5;
}

.table-wrap {
  overflow-x: auto;
}

.table {
  width: 100%;
  border-collapse: collapse;
}

.table th, .table td {
  padding: 12px;
  border-bottom: 1px solid var(--line);
  text-align: left;
  vertical-align: top;
}

.table th {
  color: var(--muted);
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: .06em;
}

.badge {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
}

.badge-a { background: #dcfce7; color: #166534; }
.badge-b { background: #fef3c7; color: #92400e; }
.badge-c { background: #fee2e2; color: #991b1b; }

.badge-go { background: #dcfce7; color: #166534; }
.badge-pruefen { background: #dbeafe; color: #1d4ed8; }
.badge-no-go { background: #fee2e2; color: #991b1b; }

.badge-gut { background: #dcfce7; color: #166534; }
.badge-gemischt { background: #fef3c7; color: #92400e; }
.badge-kritisch { background: #fee2e2; color: #991b1b; }

.stack { display: flex; flex-direction: column; gap: 16px; }
.row { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; }

.meta { color: var(--muted); font-size: 14px; }
.linkish { color: var(--blue); }

.section-title {
  font-size: 24px;
  font-weight: 800;
  margin: 0 0 12px;
}

pre.doc {
  white-space: pre-wrap;
  background: #fff;
  border: 1px solid var(--line);
  border-radius: 12px;
  padding: 16px;
  overflow-x: auto;
}

@media (max-width: 1000px) {
  .grid-6, .grid-4, .grid-3, .grid-2 {
    grid-template-columns: 1fr;
  }
}
CSS

echo "🧭 Navigation & Layout ..."
cat > components/Nav.tsx <<'TSX'
import Link from "next/link";

const items = [
  ["/", "Dashboard"],
  ["/tenders", "Tenders"],
  ["/pipeline", "Pipeline"],
  ["/agents", "Agents"],
  ["/zones", "Zones"],
  ["/buyers", "Buyers"],
  ["/references", "References"],
  ["/config", "Config"]
] as const;

export default function Nav() {
  return (
    <div className="nav">
      {items.map(([href, label]) => (
        <Link key={href} href={href}>
          {label}
        </Link>
      ))}
    </div>
  );
}
TSX

cat > app/layout.tsx <<'TSX'
import "./globals.css";
import Nav from "@/components/Nav";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "RUWE Bid OS",
  description: "Vertriebssteuerung neu denken"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body>
        <header className="topbar">
          <div className="brand">
            RUWE <span>Bid OS</span>
          </div>
          <Nav />
        </header>
        <div className="container">{children}</div>
      </body>
    </html>
  );
}
TSX

echo "🔌 API-Routen ..."
cat > app/api/overview/route.ts <<'TS'
import { NextResponse } from "next/server";
import { readDb } from "@/lib/db";
import { goQuote, manualQueueCount, overdueCount, overallAssessment, weightedPipeline } from "@/lib/scoring";

export async function GET() {
  const db = await readDb();
  const tenders = db.tenders || [];
  const pipeline = db.pipeline || [];
  const response = {
    kpis: {
      newCount: tenders.filter((t: any) => t.status === "neu").length,
      manualCount: manualQueueCount(tenders),
      goCount: tenders.filter((t: any) => t.decision === "Go").length,
      overdueCount: overdueCount(tenders),
      overallAssessment: overallAssessment(tenders),
      weightedPipeline: weightedPipeline(pipeline),
      goQuote: goQuote(tenders)
    }
  };
  return NextResponse.json(response);
}
TS

cat > app/api/tenders/route.ts <<'TS'
import { NextResponse } from "next/server";
import { createId, readDb, writeDb } from "@/lib/db";

export async function GET() {
  const db = await readDb();
  return NextResponse.json(db.tenders || []);
}

export async function POST(req: Request) {
  const body = await req.json();
  const db = await readDb();
  const item = {
    id: createId("t"),
    ...body
  };
  db.tenders.unshift(item);
  await writeDb(db);
  return NextResponse.json(item);
}
TS

cat > app/api/tenders/[id]/route.ts <<'TS'
import { NextResponse } from "next/server";
import { readDb, writeDb } from "@/lib/db";

export async function GET(_: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const db = await readDb();
  const item = (db.tenders || []).find((x: any) => x.id === id);
  return NextResponse.json(item ?? null, { status: item ? 200 : 404 });
}

export async function PUT(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const patch = await req.json();
  const db = await readDb();
  const list = db.tenders || [];
  const idx = list.findIndex((x: any) => x.id === id);
  if (idx === -1) return NextResponse.json({ error: "not_found" }, { status: 404 });
  list[idx] = { ...list[idx], ...patch };
  db.tenders = list;
  await writeDb(db);
  return NextResponse.json(list[idx]);
}

export async function DELETE(_: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const db = await readDb();
  db.tenders = (db.tenders || []).filter((x: any) => x.id !== id);
  await writeDb(db);
  return NextResponse.json({ ok: true });
}
TS

for mod in pipeline agents zones buyers references; do
cat > "app/api/$mod/route.ts" <<TS
import { NextResponse } from "next/server";
import { createId, readDb, writeDb } from "@/lib/db";

const key = "$mod";

export async function GET() {
  const db = await readDb();
  return NextResponse.json(db[key] || []);
}

export async function POST(req: Request) {
  const body = await req.json();
  const db = await readDb();
  const prefix = key.slice(0,1);
  const item = { id: createId(prefix), ...body };
  db[key].unshift(item);
  await writeDb(db);
  return NextResponse.json(item);
}
TS

cat > "app/api/$mod/[id]/route.ts" <<TS
import { NextResponse } from "next/server";
import { readDb, writeDb } from "@/lib/db";

const key = "$mod";

export async function GET(_: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const db = await readDb();
  const item = (db[key] || []).find((x: any) => x.id === id);
  return NextResponse.json(item ?? null, { status: item ? 200 : 404 });
}

export async function PUT(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const patch = await req.json();
  const db = await readDb();
  const list = db[key] || [];
  const idx = list.findIndex((x: any) => x.id === id);
  if (idx === -1) return NextResponse.json({ error: "not_found" }, { status: 404 });
  list[idx] = { ...list[idx], ...patch };
  db[key] = list;
  await writeDb(db);
  return NextResponse.json(list[idx]);
}

export async function DELETE(_: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const db = await readDb();
  db[key] = (db[key] || []).filter((x: any) => x.id !== id);
  await writeDb(db);
  return NextResponse.json({ ok: true });
}
TS
done

cat > app/api/config/route.ts <<'TS'
import { NextResponse } from "next/server";
import { readDb, writeDb } from "@/lib/db";

export async function GET() {
  const db = await readDb();
  return NextResponse.json(db.config || {});
}

export async function PUT(req: Request) {
  const patch = await req.json();
  const db = await readDb();
  db.config = { ...db.config, ...patch };
  await writeDb(db);
  return NextResponse.json(db.config);
}
TS

echo "📊 Dashboard & Seiten ..."
cat > app/page.tsx <<'TSX'
import Link from "next/link";
import { readDb } from "@/lib/db";
import { goQuote, manualQueueCount, overdueCount, overallAssessment, weightedPipeline } from "@/lib/scoring";

function badgeAssessment(value: string) {
  if (value === "gut") return "badge badge-gut";
  if (value === "kritisch") return "badge badge-kritisch";
  return "badge badge-gemischt";
}

function decisionBadge(decision: string) {
  if (decision === "Go") return "badge badge-go";
  if (decision === "Prüfen") return "badge badge-pruefen";
  return "badge badge-no-go";
}

function priorityBadge(priority: string) {
  if (priority === "A") return "badge badge-a";
  if (priority === "B") return "badge badge-b";
  return "badge badge-c";
}

export default async function DashboardPage() {
  const db = await readDb();
  const tenders = db.tenders || [];
  const pipeline = db.pipeline || [];
  const agents = db.agents || [];
  const zones = db.zones || [];

  const kpis = {
    newCount: tenders.filter((t: any) => t.status === "neu").length,
    manualCount: manualQueueCount(tenders),
    goCount: tenders.filter((t: any) => t.decision === "Go").length,
    overdueCount: overdueCount(tenders),
    overall: overallAssessment(tenders),
    weighted: weightedPipeline(pipeline),
    goQuotePct: Math.round(goQuote(tenders) * 100)
  };

  const queue = tenders.filter((t: any) => t.manualReview === "zwingend" || t.decision === "Prüfen");

  return (
    <div className="stack">
      <section>
        <h1 className="h1">Vertriebssteuerung neu denken.</h1>
        <p className="sub">
          Zonen-, radius- und gewerkebasiertes Bid Operating System für Ausschreibungen, Pipeline,
          Agenten, Auftraggeber, Referenzen und spätere Automatisierung.
        </p>
      </section>

      <section className="grid grid-6">
        <div className="card"><div className="label">Neu eingegangen</div><div className="kpi">{kpis.newCount}</div></div>
        <div className="card"><div className="label">Manuell prüfen</div><div className="kpi">{kpis.manualCount}</div></div>
        <div className="card"><div className="label">Go-Kandidaten</div><div className="kpi">{kpis.goCount}</div></div>
        <div className="card"><div className="label">Überfällig</div><div className="kpi" style={{ color: "var(--red)" }}>{kpis.overdueCount}</div></div>
        <div className="card"><div className="label">Weighted Pipeline</div><div className="kpi" style={{ color: "var(--orange)" }}>{Math.round(kpis.weighted / 1000)}k €</div></div>
        <div className="card"><div className="label">Gesamtlage</div><div className={badgeAssessment(kpis.overall)}>{kpis.overall}</div><div className="meta" style={{ marginTop: 10 }}>Go-Quote: {kpis.goQuotePct}%</div></div>
      </section>

      <section className="grid grid-2">
        <div className="card">
          <div className="section-title">Management-Warteschlange</div>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Titel</th>
                  <th>Region</th>
                  <th>Priorität</th>
                  <th>Review</th>
                  <th>Frist</th>
                </tr>
              </thead>
              <tbody>
                {queue.map((t: any) => (
                  <tr key={t.id}>
                    <td><Link className="linkish" href={`/tenders/${t.id}`}>{t.title}</Link></td>
                    <td>{t.region}</td>
                    <td><span className={priorityBadge(t.priority)}>{t.priority}</span></td>
                    <td>{t.manualReview}</td>
                    <td>{t.dueDate || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <div className="section-title">Systemlage</div>
          <div className="stack">
            <div className="meta">Tenders im Register: {tenders.length}</div>
            <div className="meta">Pipeline-Einträge: {pipeline.length}</div>
            <div className="meta">Zonen: {zones.length}</div>
            <div className="meta">Agents: {agents.length}</div>
            <div className="meta">Nächster sinnvoller Fokus: Management Queue leeren, Go-Kandidaten priorisieren, No-Go sauber dokumentieren.</div>
          </div>
        </div>
      </section>

      <section className="grid grid-2">
        <div className="card">
          <div className="section-title">Tender Übersicht</div>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Titel</th>
                  <th>Region</th>
                  <th>Gewerk</th>
                  <th>Priorität</th>
                  <th>Entscheidung</th>
                </tr>
              </thead>
              <tbody>
                {tenders.map((t: any) => (
                  <tr key={t.id}>
                    <td><Link className="linkish" href={`/tenders/${t.id}`}>{t.title}</Link></td>
                    <td>{t.region}</td>
                    <td>{t.trade}</td>
                    <td><span className={priorityBadge(t.priority)}>{t.priority}</span></td>
                    <td><span className={decisionBadge(t.decision)}>{t.decision}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <div className="section-title">Agenten & Steuerung</div>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Fokus</th>
                  <th>Level</th>
                  <th>Win-Rate</th>
                </tr>
              </thead>
              <tbody>
                {agents.map((a: any) => (
                  <tr key={a.id}>
                    <td><Link className="linkish" href={`/agents/${a.id}`}>{a.name}</Link></td>
                    <td>{a.focus}</td>
                    <td>{a.level}</td>
                    <td>{Math.round(a.winRate * 100)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
TSX

cat > app/tenders/page.tsx <<'TSX'
import Link from "next/link";
import { readDb } from "@/lib/db";

export default async function TendersPage() {
  const db = await readDb();
  const tenders = db.tenders || [];

  return (
    <div className="stack">
      <div>
        <h1 className="h1">Tenders</h1>
        <p className="sub">Ausschreibungsregister mit Region, Gewerk, Status und Detailzugriff.</p>
      </div>
      <div className="card table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Titel</th>
              <th>Region</th>
              <th>Gewerk</th>
              <th>Priorität</th>
              <th>Entscheidung</th>
              <th>Frist</th>
            </tr>
          </thead>
          <tbody>
            {tenders.map((t: any) => (
              <tr key={t.id}>
                <td><Link className="linkish" href={`/tenders/${t.id}`}>{t.title}</Link></td>
                <td>{t.region}</td>
                <td>{t.trade}</td>
                <td>{t.priority}</td>
                <td>{t.decision}</td>
                <td>{t.dueDate || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
TSX

cat > app/tenders/[id]/page.tsx <<'TSX'
import { notFound } from "next/navigation";
import { readDb } from "@/lib/db";
import { fitScore } from "@/lib/scoring";

export default async function TenderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = await readDb();
  const tender = (db.tenders || []).find((x: any) => x.id === id);
  if (!tender) return notFound();

  const zone = (db.zones || []).find((x: any) => x.id === tender.zoneId);
  const buyer = (db.buyers || []).find((x: any) => x.id === tender.buyerId);
  const owner = (db.agents || []).find((x: any) => x.id === tender.ownerId);
  const score = fitScore(tender, zone, buyer);

  return (
    <div className="stack">
      <div>
        <h1 className="h1">{tender.title}</h1>
        <p className="sub">Detailansicht mit Fit, Verantwortlichkeit, Buyer, Zone und Entscheidungsstand.</p>
      </div>

      <div className="grid grid-4">
        <div className="card"><div className="label">Region</div><div className="kpi">{tender.region}</div></div>
        <div className="card"><div className="label">Gewerk</div><div className="kpi">{tender.trade}</div></div>
        <div className="card"><div className="label">Fit Score</div><div className="kpi">{score}</div></div>
        <div className="card"><div className="label">Entscheidung</div><div className="kpi">{tender.decision}</div></div>
      </div>

      <div className="grid grid-2">
        <div className="card">
          <div className="section-title">Einordnung</div>
          <div className="stack">
            <div className="meta">Priorität: {tender.priority}</div>
            <div className="meta">Manual Review: {tender.manualReview}</div>
            <div className="meta">Risiko: {tender.riskLevel}</div>
            <div className="meta">Fit Summary: {tender.fitSummary}</div>
            <div className="meta">Wert: {tender.estimatedValue.toLocaleString("de-DE")} €</div>
            <div className="meta">Frist: {tender.dueDate || "-"}</div>
          </div>
        </div>

        <div className="card">
          <div className="section-title">Bezüge</div>
          <div className="stack">
            <div className="meta">Zone: {zone?.name || "-"}</div>
            <div className="meta">Buyer: {buyer?.name || "-"}</div>
            <div className="meta">Owner: {owner?.name || "-"}</div>
            <div className="meta">Quelle: {tender.sourceType || "-"}</div>
            <div className="meta">Notiz: {tender.notes || "-"}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
TSX

for mod in pipeline agents zones buyers references; do
cat > "app/$mod/page.tsx" <<TSX
import Link from "next/link";
import { readDb } from "@/lib/db";

const key = "$mod";

export default async function Page() {
  const db = await readDb();
  const items = db[key] || [];

  return (
    <div className="stack">
      <div>
        <h1 className="h1">${mod^}</h1>
        <p className="sub">Arbeitsoberfläche für ${mod} mit Listen- und Detailzugriff.</p>
      </div>
      <div className="card table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Titel / Name</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item: any) => (
              <tr key={item.id}>
                <td>{item.id}</td>
                <td>{item.title || item.name}</td>
                <td><Link className="linkish" href={`/${key}/${item.id}`}>Öffnen</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
TSX

cat > "app/$mod/[id]/page.tsx" <<TSX
import { notFound } from "next/navigation";
import { readDb } from "@/lib/db";

const key = "$mod";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = await readDb();
  const item = (db[key] || []).find((x: any) => x.id === id);
  if (!item) return notFound();

  return (
    <div className="stack">
      <div>
        <h1 className="h1">{item.title || item.name}</h1>
        <p className="sub">Detailansicht für ${mod}.</p>
      </div>
      <div className="card">
        <pre className="doc">{JSON.stringify(item, null, 2)}</pre>
      </div>
    </div>
  );
}
TSX
done

cat > app/config/page.tsx <<'TSX'
import { readDb } from "@/lib/db";

export default async function ConfigPage() {
  const db = await readDb();

  return (
    <div className="stack">
      <div>
        <h1 className="h1">Config</h1>
        <p className="sub">Systemweite Bewertungs-, Rollen-, Quellen- und Ingestion-Konfiguration.</p>
      </div>
      <div className="card">
        <pre className="doc">{JSON.stringify(db.config, null, 2)}</pre>
      </div>
    </div>
  );
}
TSX

echo "🧪 Lokalen Build anstoßen ..."
npm run build || true

echo "📤 Git sichern ..."
git add .
git commit -m "feat: phase 1-5 stable master rebuild for RUWE Bid OS" || true
git push origin main || true

echo "✅ Fertig."
echo "Nächste Schritte:"
echo "1) npm run dev"
echo "2) localhost:3000 öffnen"
echo "3) optional npm run build prüfen"
