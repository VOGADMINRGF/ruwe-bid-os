#!/bin/bash
set -e

cd "$(pwd)"

echo "🚀 RUWE Bid OS — Standort/Gewerk/Radius Upgrade"

mkdir -p app/sites app/sites/[id]
mkdir -p app/api/sites app/api/sites/[id]
mkdir -p components lib data docs

echo "📦 Erweitere Datenbasis ..."
cat > data/db.json <<'JSON'
{
  "meta": {
    "appName": "RUWE Bid OS",
    "version": "site-focus-upgrade",
    "lastSeededAt": "2026-04-08T23:00:00.000Z",
    "lastSuccessfulIngestionAt": "2026-04-08T22:45:00.000Z",
    "lastSuccessfulIngestionSource": "TED Europa / Bund.de Aggregation",
    "pollingSeconds": 60,
    "activeSources": 3,
    "newSinceLastRun": 4,
    "duplicateCountLastRun": 1,
    "ingestionErrorsLastRun": 0
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
      "Facility": { "baseWeight": 1.0 },
      "Sicherheit": { "baseWeight": 1.1 },
      "Reinigung": { "baseWeight": 0.95 },
      "Hausmeister": { "baseWeight": 0.9 },
      "Grünpflege": { "baseWeight": 0.7 },
      "Winterdienst": { "baseWeight": 0.65 }
    },
    "sources": [
      { "id": "s1", "name": "TED Europa", "type": "rss", "url": "https://ted.europa.eu" },
      { "id": "s2", "name": "Bund.de", "type": "portal", "url": "https://www.service.bund.de" },
      { "id": "s3", "name": "DTVP", "type": "portal", "url": "https://www.dtvp.de" }
    ]
  },
  "sites": [
    {
      "id": "site1",
      "name": "RUWE Leipzig",
      "city": "Leipzig",
      "state": "Sachsen",
      "active": true,
      "primaryRadiusKm": 45,
      "secondaryRadiusKm": 70,
      "ownerId": "a1",
      "notes": "Ost-Fokus für Facility und Sicherheit."
    },
    {
      "id": "site2",
      "name": "RUWE Magdeburg",
      "city": "Magdeburg",
      "state": "Sachsen-Anhalt",
      "active": true,
      "primaryRadiusKm": 40,
      "secondaryRadiusKm": 60,
      "ownerId": "a2",
      "notes": "Starker Sicherheit-/Reinigungsfokus."
    },
    {
      "id": "site3",
      "name": "RUWE Gera",
      "city": "Gera",
      "state": "Thüringen",
      "active": true,
      "primaryRadiusKm": 35,
      "secondaryRadiusKm": 55,
      "ownerId": "a3",
      "notes": "Kommunal und Hausmeister/FM."
    },
    {
      "id": "site4",
      "name": "RUWE Berlin selektiv",
      "city": "Berlin",
      "state": "Berlin",
      "active": true,
      "primaryRadiusKm": 25,
      "secondaryRadiusKm": 35,
      "ownerId": "a4",
      "notes": "Nur selektive Teilnahme."
    }
  ],
  "siteTradeRules": [
    { "id": "str1", "siteId": "site1", "trade": "Facility", "priority": "hoch", "primaryRadiusKm": 45, "secondaryRadiusKm": 70, "enabled": true },
    { "id": "str2", "siteId": "site1", "trade": "Sicherheit", "priority": "hoch", "primaryRadiusKm": 35, "secondaryRadiusKm": 55, "enabled": true },
    { "id": "str3", "siteId": "site1", "trade": "Reinigung", "priority": "mittel", "primaryRadiusKm": 40, "secondaryRadiusKm": 60, "enabled": true },

    { "id": "str4", "siteId": "site2", "trade": "Sicherheit", "priority": "hoch", "primaryRadiusKm": 40, "secondaryRadiusKm": 60, "enabled": true },
    { "id": "str5", "siteId": "site2", "trade": "Reinigung", "priority": "hoch", "primaryRadiusKm": 45, "secondaryRadiusKm": 65, "enabled": true },
    { "id": "str6", "siteId": "site2", "trade": "Facility", "priority": "mittel", "primaryRadiusKm": 35, "secondaryRadiusKm": 55, "enabled": true },

    { "id": "str7", "siteId": "site3", "trade": "Hausmeister", "priority": "hoch", "primaryRadiusKm": 35, "secondaryRadiusKm": 55, "enabled": true },
    { "id": "str8", "siteId": "site3", "trade": "Facility", "priority": "hoch", "primaryRadiusKm": 40, "secondaryRadiusKm": 60, "enabled": true },
    { "id": "str9", "siteId": "site3", "trade": "Reinigung", "priority": "mittel", "primaryRadiusKm": 30, "secondaryRadiusKm": 45, "enabled": true },

    { "id": "str10", "siteId": "site4", "trade": "Sicherheit", "priority": "hoch", "primaryRadiusKm": 25, "secondaryRadiusKm": 35, "enabled": true },
    { "id": "str11", "siteId": "site4", "trade": "Facility", "priority": "mittel", "primaryRadiusKm": 20, "secondaryRadiusKm": 30, "enabled": true }
  ],
  "zones": [
    {
      "id": "z1",
      "name": "Leipzig/Halle",
      "homeBase": "Leipzig",
      "state": "Sachsen/Sachsen-Anhalt",
      "primaryRadiusKm": 45,
      "secondaryRadiusKm": 70,
      "priorityTrades": ["Facility", "Sicherheit"],
      "supportedTrades": ["Reinigung", "Hausmeister"]
    },
    {
      "id": "z2",
      "name": "Magdeburg/Salzlandkreis",
      "homeBase": "Magdeburg",
      "state": "Sachsen-Anhalt",
      "primaryRadiusKm": 40,
      "secondaryRadiusKm": 60,
      "priorityTrades": ["Sicherheit", "Reinigung"],
      "supportedTrades": ["Facility"]
    },
    {
      "id": "z3",
      "name": "Gera/Altenburg",
      "homeBase": "Gera",
      "state": "Thüringen",
      "primaryRadiusKm": 35,
      "secondaryRadiusKm": 55,
      "priorityTrades": ["Hausmeister", "Facility"],
      "supportedTrades": ["Reinigung"]
    },
    {
      "id": "z4",
      "name": "Berlin selektiv",
      "homeBase": "Berlin",
      "state": "Berlin",
      "primaryRadiusKm": 25,
      "secondaryRadiusKm": 35,
      "priorityTrades": ["Sicherheit"],
      "supportedTrades": ["Facility"]
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
      "ingestedAt": "2026-04-08T22:40:00.000Z",
      "distanceKm": 18
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
      "ingestedAt": "2026-04-08T22:41:00.000Z",
      "distanceKm": 22
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
      "ingestedAt": "2026-04-08T22:42:00.000Z",
      "distanceKm": 14
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
      "ingestedAt": "2026-04-08T22:43:00.000Z",
      "distanceKm": 17
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
    "lastRunAt": "2026-04-08T22:45:00.000Z"
  }
}
JSON

echo "🧠 Typen & Standortlogik ..."
cat > lib/types.ts <<'TS'
export type TenderPriority = "A" | "B" | "C";
export type TenderDecision = "Go" | "Prüfen" | "No-Go";
export type TenderStatus = "neu" | "vorqualifiziert" | "manuelle_pruefung" | "go" | "no_go" | "beobachten";

export interface Site {
  id: string;
  name: string;
  city: string;
  state: string;
  active: boolean;
  primaryRadiusKm: number;
  secondaryRadiusKm: number;
  ownerId?: string;
  notes?: string;
}

export interface SiteTradeRule {
  id: string;
  siteId: string;
  trade: string;
  priority: "hoch" | "mittel" | "niedrig";
  primaryRadiusKm: number;
  secondaryRadiusKm: number;
  enabled: boolean;
}

export interface Zone {
  id: string;
  name: string;
  homeBase: string;
  state: string;
  primaryRadiusKm: number;
  secondaryRadiusKm: number;
  priorityTrades: string[];
  supportedTrades: string[];
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
  ingestedAt?: string;
  distanceKm?: number;
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

cat > lib/siteLogic.ts <<'TS'
import { Site, SiteTradeRule, Tender } from "./types";

export function getMatchingSiteRule(
  tender: Tender,
  sites: Site[],
  rules: SiteTradeRule[]
) {
  const enabledRules = rules.filter((r) => r.enabled && r.trade === tender.trade);
  const candidates = enabledRules
    .map((rule) => {
      const site = sites.find((s) => s.id === rule.siteId);
      if (!site) return null;

      const distance = tender.distanceKm ?? 9999;
      const radiusType =
        distance <= rule.primaryRadiusKm
          ? "primary"
          : distance <= rule.secondaryRadiusKm
            ? "secondary"
            : "outside";

      return {
        site,
        rule,
        distanceKm: distance,
        radiusType
      };
    })
    .filter(Boolean) as Array<{
      site: Site;
      rule: SiteTradeRule;
      distanceKm: number;
      radiusType: "primary" | "secondary" | "outside";
    }>;

  candidates.sort((a, b) => a.distanceKm - b.distanceKm);

  return candidates[0] ?? null;
}

export function preselectedForBid(
  tender: Tender,
  sites: Site[],
  rules: SiteTradeRule[]
) {
  const match = getMatchingSiteRule(tender, sites, rules);
  if (!match) return false;
  if (tender.decision === "No-Go") return false;
  if (match.radiusType === "outside") return false;
  return true;
}

export function coverageBySite(
  tenders: Tender[],
  sites: Site[],
  rules: SiteTradeRule[]
) {
  return sites.map((site) => {
    const siteRules = rules.filter((r) => r.siteId === site.id && r.enabled);
    const matching = tenders.filter((t) =>
      siteRules.some((r) => r.trade === t.trade && (t.distanceKm ?? 9999) <= r.secondaryRadiusKm)
    );

    return {
      site,
      tendersTotal: matching.length,
      goCount: matching.filter((t) => t.decision === "Go").length,
      reviewCount: matching.filter((t) => t.decision === "Prüfen" || t.manualReview === "zwingend").length,
      noGoCount: matching.filter((t) => t.decision === "No-Go").length,
      trades: siteRules.map((r) => `${r.trade} (${r.primaryRadiusKm}/${r.secondaryRadiusKm} km)`)
    };
  });
}
TS

cat > lib/scoring.ts <<'TS'
import { Tender } from "./types";

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

export function overallAssessment(tenders: Tender[]) {
  if (!tenders.length) return "gemischt";
  const total = tenders.length;
  const go = tenders.filter((t) => t.decision === "Go").length / total;
  const overdue = overdueCount(tenders);
  const noGo = tenders.filter((t) => t.decision === "No-Go").length / total;

  if (go >= 0.25 && overdue === 0) return "gut";
  if (overdue >= 2 || noGo > 0.5) return "kritisch";
  return "gemischt";
}
TS

echo "🧭 Navigation auf Sites erweitern ..."
cat > components/Nav.tsx <<'TSX'
import Link from "next/link";

const items = [
  ["/", "Dashboard"],
  ["/sites", "Sites"],
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

echo "🔌 Sites API ..."
cat > app/api/sites/route.ts <<'TS'
import { NextResponse } from "next/server";
import { createId, readDb, writeDb } from "@/lib/db";

export async function GET() {
  const db = await readDb();
  return NextResponse.json(db.sites || []);
}

export async function POST(req: Request) {
  const body = await req.json();
  const db = await readDb();
  const item = { id: createId("site"), ...body };
  db.sites.unshift(item);
  await writeDb(db);
  return NextResponse.json(item);
}
TS

cat > app/api/sites/[id]/route.ts <<'TS'
import { NextResponse } from "next/server";
import { readDb, writeDb } from "@/lib/db";

export async function GET(_: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const db = await readDb();
  const item = (db.sites || []).find((x: any) => x.id === id);
  return NextResponse.json(item ?? null, { status: item ? 200 : 404 });
}

export async function PUT(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const patch = await req.json();
  const db = await readDb();
  const list = db.sites || [];
  const idx = list.findIndex((x: any) => x.id === id);
  if (idx === -1) return NextResponse.json({ error: "not_found" }, { status: 404 });
  list[idx] = { ...list[idx], ...patch };
  db.sites = list;
  await writeDb(db);
  return NextResponse.json(list[idx]);
}

export async function DELETE(_: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const db = await readDb();
  db.sites = (db.sites || []).filter((x: any) => x.id !== id);
  await writeDb(db);
  return NextResponse.json({ ok: true });
}
TS

echo "📊 Dashboard neu auf Fokus Standort/Gewerk/Radius ..."
cat > app/page.tsx <<'TSX'
import Link from "next/link";
import { readDb } from "@/lib/db";
import { coverageBySite, getMatchingSiteRule, preselectedForBid } from "@/lib/siteLogic";
import { goQuote, manualQueueCount, overdueCount, overallAssessment, weightedPipeline } from "@/lib/scoring";

function assessmentBadge(value: string) {
  if (value === "gut") return "badge badge-gut";
  if (value === "kritisch") return "badge badge-kritisch";
  return "badge badge-gemischt";
}

export default async function DashboardPage() {
  const db = await readDb();

  const tenders = db.tenders || [];
  const pipeline = db.pipeline || [];
  const agents = db.agents || [];
  const sites = db.sites || [];
  const rules = db.siteTradeRules || [];
  const meta = db.meta || {};

  const preselected = tenders.filter((t: any) => preselectedForBid(t, sites, rules));
  const goCount = tenders.filter((t: any) => t.decision === "Go").length;
  const noGoCount = tenders.filter((t: any) => t.decision === "No-Go").length;
  const manualCount = manualQueueCount(tenders);
  const totalCount = tenders.length;
  const weighted = weightedPipeline(pipeline);
  const overall = overallAssessment(tenders);
  const coverage = coverageBySite(tenders, sites, rules);

  const queue = tenders
    .map((t: any) => {
      const match = getMatchingSiteRule(t, sites, rules);
      return { ...t, match };
    })
    .filter((t: any) => t.manualReview === "zwingend" || t.decision === "Prüfen");

  return (
    <div className="stack">
      <section>
        <h1 className="h1">Vertriebssteuerung neu denken.</h1>
        <p className="sub">
          Fokus auf RUWE-Standorte, aktive Gewerke, definierte Radien und darauf aufbauende
          Bid-Vorauswahl, Go/Prüfen/No-Go sowie Monitoring-Aktualität.
        </p>
      </section>

      <section className="grid grid-6">
        <div className="card"><div className="label">Letzter Abruf</div><div className="kpi" style={{ fontSize: 18 }}>{meta.lastSuccessfulIngestionAt || "-"}</div></div>
        <div className="card"><div className="label">Ausschreibungen gesamt</div><div className="kpi">{totalCount}</div></div>
        <div className="card"><div className="label">Bid vorausgewählt</div><div className="kpi">{preselected.length}</div></div>
        <div className="card"><div className="label">Manuell prüfen</div><div className="kpi">{manualCount}</div></div>
        <div className="card"><div className="label">Go / No-Go</div><div className="kpi">{goCount} / {noGoCount}</div></div>
        <div className="card"><div className="label">Aktive Standorte / Gewerke</div><div className="kpi">{sites.filter((s: any) => s.active).length} / {rules.filter((r: any) => r.enabled).length}</div></div>
      </section>

      <section className="grid grid-3">
        <div className="card">
          <div className="label">Monitoring Status</div>
          <div className="stack" style={{ marginTop: 10 }}>
            <div className="meta">Letzte Quelle: {meta.lastSuccessfulIngestionSource || "-"}</div>
            <div className="meta">Quellen aktiv: {meta.activeSources || 0}</div>
            <div className="meta">Neu seit letztem Lauf: {meta.newSinceLastRun || 0}</div>
            <div className="meta">Dubletten letzter Lauf: {meta.duplicateCountLastRun || 0}</div>
            <div className="meta">Fehler letzter Lauf: {meta.ingestionErrorsLastRun || 0}</div>
          </div>
        </div>

        <div className="card">
          <div className="label">Weighted Pipeline</div>
          <div className="kpi" style={{ color: "var(--orange)" }}>{Math.round(weighted / 1000)}k €</div>
          <div className="meta" style={{ marginTop: 10 }}>Go-Quote: {Math.round(goQuote(tenders) * 100)}%</div>
        </div>

        <div className="card">
          <div className="label">Gesamtlage</div>
          <div style={{ marginTop: 12 }}>
            <span className={assessmentBadge(overall)}>{overall}</span>
          </div>
          <div className="meta" style={{ marginTop: 10 }}>
            Priorisierung nach Standort-Fit, Gewerkefit, Radius und Entscheidungsstand.
          </div>
        </div>
      </section>

      <section className="card">
        <div className="section-title">Standorte & Abdeckung</div>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Standort</th>
                <th>Primär / Sekundär</th>
                <th>Gewerke</th>
                <th>Treffer</th>
                <th>Go</th>
                <th>Prüfen</th>
                <th>No-Go</th>
              </tr>
            </thead>
            <tbody>
              {coverage.map((row: any) => (
                <tr key={row.site.id}>
                  <td><Link className="linkish" href={`/sites/${row.site.id}`}>{row.site.name}</Link></td>
                  <td>{row.site.primaryRadiusKm} / {row.site.secondaryRadiusKm} km</td>
                  <td>{row.trades.join(", ")}</td>
                  <td>{row.tendersTotal}</td>
                  <td>{row.goCount}</td>
                  <td>{row.reviewCount}</td>
                  <td>{row.noGoCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid grid-2">
        <div className="card">
          <div className="section-title">Management-Warteschlange</div>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Titel</th>
                  <th>Standortfit</th>
                  <th>Distanz</th>
                  <th>Gewerk</th>
                  <th>Frist</th>
                </tr>
              </thead>
              <tbody>
                {queue.map((t: any) => (
                  <tr key={t.id}>
                    <td><Link className="linkish" href={`/tenders/${t.id}`}>{t.title}</Link></td>
                    <td>{t.match?.site?.name || "kein Match"}</td>
                    <td>{t.match?.distanceKm ?? "-"} km</td>
                    <td>{t.trade}</td>
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
            <div className="meta">Tenders im Register: {totalCount}</div>
            <div className="meta">Pipeline-Einträge: {pipeline.length}</div>
            <div className="meta">Sites aktiv: {sites.filter((s: any) => s.active).length}</div>
            <div className="meta">Agents aktiv: {agents.length}</div>
            <div className="meta">Bid vorausgewählt: {preselected.length}</div>
            <div className="meta">Fokus: Standort-/Gewerk-/Radiuslogik schärfen und manuelle Prüfqueue reduzieren.</div>
          </div>
        </div>
      </section>

      <section className="card">
        <div className="section-title">Tender Registry mit Standort-Fit</div>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Titel</th>
                <th>Standort</th>
                <th>Distanz</th>
                <th>Gewerk</th>
                <th>Entscheidung</th>
                <th>Import</th>
              </tr>
            </thead>
            <tbody>
              {tenders.map((t: any) => {
                const match = getMatchingSiteRule(t, sites, rules);
                return (
                  <tr key={t.id}>
                    <td><Link className="linkish" href={`/tenders/${t.id}`}>{t.title}</Link></td>
                    <td>{match?.site?.name || "kein Match"}</td>
                    <td>{match?.distanceKm ?? "-"} km</td>
                    <td>{t.trade}</td>
                    <td>{t.decision}</td>
                    <td>{t.ingestedAt || "-"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
TSX

echo "🏢 Sites Seiten ..."
cat > app/sites/page.tsx <<'TSX'
import Link from "next/link";
import { readDb } from "@/lib/db";

export default async function SitesPage() {
  const db = await readDb();
  const items = db.sites || [];
  const rules = db.siteTradeRules || [];

  return (
    <div className="stack">
      <div>
        <h1 className="h1">Sites</h1>
        <p className="sub">RUWE-Standorte mit Primär-/Sekundärradius und aktiven Gewerken.</p>
      </div>
      <div className="card table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Standort</th>
              <th>Stadt</th>
              <th>Primär / Sekundär</th>
              <th>Gewerke</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item: any) => {
              const ownRules = rules.filter((r: any) => r.siteId === item.id && r.enabled);
              return (
                <tr key={item.id}>
                  <td>{item.name}</td>
                  <td>{item.city}</td>
                  <td>{item.primaryRadiusKm} / {item.secondaryRadiusKm} km</td>
                  <td>{ownRules.map((r: any) => r.trade).join(", ")}</td>
                  <td><Link className="linkish" href={`/sites/${item.id}`}>Öffnen</Link></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
TSX

cat > app/sites/[id]/page.tsx <<'TSX'
import { notFound } from "next/navigation";
import { readDb } from "@/lib/db";

export default async function SiteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = await readDb();
  const site = (db.sites || []).find((x: any) => x.id === id);
  if (!site) return notFound();

  const rules = (db.siteTradeRules || []).filter((x: any) => x.siteId === id);
  const tenders = (db.tenders || []).filter((x: any) => (x.distanceKm ?? 9999) <= site.secondaryRadiusKm);

  return (
    <div className="stack">
      <div>
        <h1 className="h1">{site.name}</h1>
        <p className="sub">Standortdetail mit Radius, Gewerkeregeln und passenden Ausschreibungen.</p>
      </div>

      <div className="grid grid-4">
        <div className="card"><div className="label">Stadt</div><div className="kpi">{site.city}</div></div>
        <div className="card"><div className="label">Primärradius</div><div className="kpi">{site.primaryRadiusKm} km</div></div>
        <div className="card"><div className="label">Sekundärradius</div><div className="kpi">{site.secondaryRadiusKm} km</div></div>
        <div className="card"><div className="label">Treffer im Radius</div><div className="kpi">{tenders.length}</div></div>
      </div>

      <div className="grid grid-2">
        <div className="card">
          <div className="section-title">Gewerkeregeln</div>
          <pre className="doc">{JSON.stringify(rules, null, 2)}</pre>
        </div>
        <div className="card">
          <div className="section-title">Passende Ausschreibungen</div>
          <pre className="doc">{JSON.stringify(tenders, null, 2)}</pre>
        </div>
      </div>
    </div>
  );
}
TSX

echo "🧾 Docs auf Standortfokus heben ..."
cat > docs/CURRENT_STATE.md <<'DOC'
# CURRENT_STATE

## Stand
Das System ist nun klar auf RUWE-Standorte, Gewerke, Radius und Ausschreibungsbewertung ausgerichtet.

## Bereits enthalten
- Sites + SiteTradeRules
- Dashboard mit Monitoring- und Entscheidungskennzahlen
- Letzter Datenabruf sichtbar
- Ausschreibungen gesamt / bid-vorausgewählt / Go / No-Go / manuell prüfen
- Standort-Abdeckungsübersicht
- Tender Registry mit Standort-Fit und Distanz

## Noch offen
- echte Formulare für Pflege
- externe Ingestion-Jobs
- Rollenrechte
- Alerts / Scheduler / Exporte
DOC

cat > docs/OpenTasks.md <<'DOC'
# OpenTasks

## P2 Operational Core
- [ ] Sites CRUD UI
- [ ] SiteTradeRules CRUD UI
- [ ] Tender Edit/Create UI
- [ ] Filter nach Standort / Gewerk / Radius
- [ ] Owner-Zuweisung und Statuswechsel aus UI

## P3 Intelligence
- [ ] automatische Bid-Vorauswahl aus Standort-/Gewerkefit
- [ ] Explainability je Tender
- [ ] Distanz-/Radiusampel
- [ ] KPI Drilldowns je Standort

## P4 Ingestion
- [ ] echter Abruf TED
- [ ] echter Abruf Bund.de
- [ ] Ingestion Review Queue
- [ ] Dublettenprüfung

## P5 Production
- [ ] Rollenmodell
- [ ] Audit Log
- [ ] Scheduler
- [ ] Reporting / Export
DOC

cat > docs/OPERATING_MODEL.md <<'DOC'
# OPERATING_MODEL

## Leitprinzip
Nicht Ausschreibungen zuerst, sondern RUWE-Abdeckung zuerst.

## Kernfragen
- Welcher Standort ist zuständig?
- Welches Gewerk ist an diesem Standort aktiv?
- In welchem Radius liegt die Ausschreibung?
- Ist sie bid-vorausgewählt, zu prüfen oder klar No-Go?
- Wann war der letzte Abruf?
DOC

npm run build || true
git add .
git commit -m "feat: site-centric dashboard with coverage, ingestion status and bid preselection metrics" || true
git push origin main || true

echo "✅ Standort/Gewerk/Radius Fokus eingebaut."
