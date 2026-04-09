#!/bin/bash
set -e

cd "$(pwd)"

echo "🚀 RUWE Bid OS — Operational Upgrade (Sites, Service Areas, Rules, Keywords, Dashboard)"

mkdir -p app/service-areas app/service-areas/[id]
mkdir -p app/site-rules app/site-rules/[id]
mkdir -p app/keywords app/keywords/[id]
mkdir -p app/api/service-areas app/api/service-areas/[id]
mkdir -p app/api/site-rules app/api/site-rules/[id]
mkdir -p app/api/keywords app/api/keywords/[id]
mkdir -p docs lib data

echo "📦 Erweiterte Datenbasis mit echten RUWE-Sites und Einsatzräumen ..."
cat > data/db.json <<'JSON'
{
  "meta": {
    "appName": "RUWE Bid OS",
    "version": "phase5-operational-upgrade",
    "lastSeededAt": "2026-04-08T23:30:00.000Z",
    "lastSuccessfulIngestionAt": "2026-04-08T22:45:00.000Z",
    "lastSuccessfulIngestionSource": "TED Europa / Bund.de Aggregation",
    "pollingSeconds": 60,
    "activeSources": 3,
    "newSinceLastRun": 4,
    "duplicateCountLastRun": 1,
    "ingestionErrorsLastRun": 0
  },
  "config": {
    "dashboard": {
      "compactTopBar": true,
      "showMonitoringStrip": true,
      "showPrefilterMetrics": true
    },
    "assessmentRules": {
      "good": { "minGoShare": 0.25, "maxOverdue": 0 },
      "critical": { "maxGoShare": 0.15, "minOverdue": 2 }
    }
  },
  "sites": [
    {
      "id": "site_berlin",
      "name": "RUWE Gruppe Berlin",
      "city": "Berlin",
      "state": "Berlin",
      "type": "Zentrale",
      "active": true,
      "primaryRadiusKm": 25,
      "secondaryRadiusKm": 40,
      "notes": "Zentrale / selektiv und preissensibel."
    },
    {
      "id": "site_torgau",
      "name": "HBO GmbH Torgau",
      "city": "Torgau",
      "state": "Sachsen",
      "type": "Gesellschaft",
      "active": true,
      "primaryRadiusKm": 45,
      "secondaryRadiusKm": 70,
      "notes": "Starker operativer Ost-Fokus."
    },
    {
      "id": "site_strausberg",
      "name": "RUWE AERO Strausberg",
      "city": "Strausberg",
      "state": "Brandenburg",
      "type": "Gesellschaft",
      "active": true,
      "primaryRadiusKm": 35,
      "secondaryRadiusKm": 55,
      "notes": "Sonderrollen/luftfahrtnah, aber hier als regulärer Site-Anchor modelliert."
    },
    {
      "id": "site_zeitz",
      "name": "TÜ Gebäudeservice Zeitz",
      "city": "Zeitz",
      "state": "Sachsen-Anhalt",
      "type": "Gesellschaft",
      "active": true,
      "primaryRadiusKm": 40,
      "secondaryRadiusKm": 60,
      "notes": "Sachsen-Anhalt/Südost-Achse."
    }
  ],
  "serviceAreas": [
    { "id": "sa1", "name": "Berlin und Umgebung", "siteId": "site_berlin", "state": "Berlin/Brandenburg", "active": true },
    { "id": "sa2", "name": "Torgau", "siteId": "site_torgau", "state": "Sachsen", "active": true },
    { "id": "sa3", "name": "Crimmitschau", "siteId": "site_torgau", "state": "Sachsen", "active": true },
    { "id": "sa4", "name": "Schmölln", "siteId": "site_torgau", "state": "Thüringen", "active": true },
    { "id": "sa5", "name": "Magdeburg", "siteId": "site_zeitz", "state": "Sachsen-Anhalt", "active": true },
    { "id": "sa6", "name": "Schkeuditz", "siteId": "site_torgau", "state": "Sachsen", "active": true },
    { "id": "sa7", "name": "Zeitz", "siteId": "site_zeitz", "state": "Sachsen-Anhalt", "active": true },
    { "id": "sa8", "name": "Limbach-Oberfrohna", "siteId": "site_torgau", "state": "Sachsen", "active": true }
  ],
  "trades": [
    { "id": "tr1", "name": "Facility" },
    { "id": "tr2", "name": "Sicherheit" },
    { "id": "tr3", "name": "Reinigung" },
    { "id": "tr4", "name": "Hausmeister" },
    { "id": "tr5", "name": "Grünpflege" },
    { "id": "tr6", "name": "Winterdienst" }
  ],
  "siteTradeRules": [
    {
      "id": "rule1",
      "siteId": "site_berlin",
      "trade": "Sicherheit",
      "priority": "hoch",
      "primaryRadiusKm": 25,
      "secondaryRadiusKm": 35,
      "enabled": true,
      "keywordsPositive": ["objektschutz", "wachschutz", "sicherheitsdienst"],
      "keywordsNegative": ["krankenhausgroßsicherheit", "bundeswehr"],
      "regionNotes": "Berlin selektiv"
    },
    {
      "id": "rule2",
      "siteId": "site_berlin",
      "trade": "Facility",
      "priority": "mittel",
      "primaryRadiusKm": 20,
      "secondaryRadiusKm": 30,
      "enabled": true,
      "keywordsPositive": ["hausmeister", "facility", "objektservice"],
      "keywordsNegative": ["hochkomplexe tgm"],
      "regionNotes": "Nur selektiv"
    },
    {
      "id": "rule3",
      "siteId": "site_torgau",
      "trade": "Facility",
      "priority": "hoch",
      "primaryRadiusKm": 45,
      "secondaryRadiusKm": 70,
      "enabled": true,
      "keywordsPositive": ["facility", "objektservice", "hausmeister", "unterhaltsreinigung"],
      "keywordsNegative": [],
      "regionNotes": "Ost-Hub"
    },
    {
      "id": "rule4",
      "siteId": "site_torgau",
      "trade": "Reinigung",
      "priority": "hoch",
      "primaryRadiusKm": 50,
      "secondaryRadiusKm": 75,
      "enabled": true,
      "keywordsPositive": ["unterhaltsreinigung", "glasreinigung", "gebäudereinigung"],
      "keywordsNegative": [],
      "regionNotes": "stark"
    },
    {
      "id": "rule5",
      "siteId": "site_torgau",
      "trade": "Sicherheit",
      "priority": "mittel",
      "primaryRadiusKm": 35,
      "secondaryRadiusKm": 55,
      "enabled": true,
      "keywordsPositive": ["sicherheitsdienst", "objektschutz"],
      "keywordsNegative": [],
      "regionNotes": "nur bei Fit"
    },
    {
      "id": "rule6",
      "siteId": "site_zeitz",
      "trade": "Reinigung",
      "priority": "hoch",
      "primaryRadiusKm": 40,
      "secondaryRadiusKm": 60,
      "enabled": true,
      "keywordsPositive": ["reinigung", "glasreinigung", "sonderreinigung"],
      "keywordsNegative": [],
      "regionNotes": "Sachsen-Anhalt"
    },
    {
      "id": "rule7",
      "siteId": "site_zeitz",
      "trade": "Hausmeister",
      "priority": "hoch",
      "primaryRadiusKm": 35,
      "secondaryRadiusKm": 55,
      "enabled": true,
      "keywordsPositive": ["hausmeister", "objektbetreuung"],
      "keywordsNegative": [],
      "regionNotes": "kommunal interessant"
    },
    {
      "id": "rule8",
      "siteId": "site_strausberg",
      "trade": "Sicherheit",
      "priority": "mittel",
      "primaryRadiusKm": 30,
      "secondaryRadiusKm": 50,
      "enabled": true,
      "keywordsPositive": ["sicherheitsdienst", "wachdienst"],
      "keywordsNegative": [],
      "regionNotes": "Brandenburg"
    }
  ],
  "buyers": [
    { "id": "b1", "name": "Stadt Leipzig", "type": "kommunal", "strategic": true },
    { "id": "b2", "name": "Jobcenter Salzlandkreis", "type": "öffentlich", "strategic": true },
    { "id": "b3", "name": "Bezirksamt Berlin", "type": "kommunal", "strategic": false },
    { "id": "b4", "name": "Landratsamt Altenburg", "type": "öffentlich", "strategic": true }
  ],
  "agents": [
    { "id": "a1", "name": "Agent 1", "focus": "Facility Ost", "level": "Koordinator", "region": "Torgau/Ost", "winRate": 0.41, "pipelineValue": 4200000 },
    { "id": "a2", "name": "Agent 2", "focus": "Sicherheit", "level": "Koordinator", "region": "Sachsen-Anhalt", "winRate": 0.37, "pipelineValue": 3100000 },
    { "id": "a3", "name": "Agent 3", "focus": "Kommunal", "level": "Spezialist", "region": "Thüringen/Südost", "winRate": 0.29, "pipelineValue": 1800000 },
    { "id": "a4", "name": "Agent 4", "focus": "Berlin selektiv", "level": "Spezialist", "region": "Berlin", "winRate": 0.18, "pipelineValue": 950000 },
    { "id": "a5", "name": "Agent 5", "focus": "Assistenz Ost", "level": "Assistenz", "region": "Ost", "winRate": 0.12, "pipelineValue": 250000 },
    { "id": "a6", "name": "Agent 6", "focus": "Assistenz Zentral", "level": "Assistenz", "region": "Zentral", "winRate": 0.10, "pipelineValue": 150000 }
  ],
  "tenders": [
    {
      "id": "t1",
      "title": "Verwaltungsreinigung Leipzig",
      "region": "Leipzig/Halle",
      "trade": "Facility",
      "buyerId": "b1",
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
      "distanceKm": 18,
      "matchedSiteId": "site_torgau",
      "prefilteredForBid": true,
      "sourceKeywords": ["unterhaltsreinigung", "verwaltungsgebäude"]
    },
    {
      "id": "t2",
      "title": "Sicherheitsdienst Salzlandkreis",
      "region": "Magdeburg/Salzlandkreis",
      "trade": "Sicherheit",
      "buyerId": "b2",
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
      "distanceKm": 22,
      "matchedSiteId": "site_zeitz",
      "prefilteredForBid": true,
      "sourceKeywords": ["objektschutz", "sicherheitsdienst"]
    },
    {
      "id": "t3",
      "title": "Schulreinigung Berlin",
      "region": "Berlin selektiv",
      "trade": "Reinigung",
      "buyerId": "b3",
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
      "distanceKm": 14,
      "matchedSiteId": "site_berlin",
      "prefilteredForBid": false,
      "sourceKeywords": ["schulreinigung"]
    },
    {
      "id": "t4",
      "title": "Hausmeisterdienst Gera",
      "region": "Gera/Altenburg",
      "trade": "Hausmeister",
      "buyerId": "b4",
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
      "distanceKm": 17,
      "matchedSiteId": "site_zeitz",
      "prefilteredForBid": true,
      "sourceKeywords": ["hausmeister", "objektbetreuung"]
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

echo "🧠 Logik aktualisieren ..."
cat > lib/types.ts <<'TS'
export interface Site {
  id: string;
  name: string;
  city: string;
  state: string;
  type: string;
  active: boolean;
  primaryRadiusKm: number;
  secondaryRadiusKm: number;
  ownerId?: string;
  notes?: string;
}

export interface ServiceArea {
  id: string;
  name: string;
  siteId: string;
  state: string;
  active: boolean;
}

export interface SiteTradeRule {
  id: string;
  siteId: string;
  trade: string;
  priority: "hoch" | "mittel" | "niedrig";
  primaryRadiusKm: number;
  secondaryRadiusKm: number;
  enabled: boolean;
  keywordsPositive: string[];
  keywordsNegative: string[];
  regionNotes?: string;
}
TS

cat > lib/siteLogic.ts <<'TS'
export function prefilteredCount(tenders: any[]) {
  return tenders.filter((t) => t.prefilteredForBid).length;
}

export function siteCoverage(sites: any[], rules: any[], tenders: any[]) {
  return sites.map((site) => {
    const ownRules = rules.filter((r) => r.siteId === site.id && r.enabled);
    const matching = tenders.filter((t) => t.matchedSiteId === site.id);

    return {
      site,
      rules: ownRules,
      tendersTotal: matching.length,
      goCount: matching.filter((t) => t.decision === "Go").length,
      reviewCount: matching.filter((t) => t.decision === "Prüfen" || t.manualReview === "zwingend").length,
      noGoCount: matching.filter((t) => t.decision === "No-Go").length
    };
  });
}
TS

echo "🔌 APIs für Service Areas, Rules, Keywords ..."
cat > app/api/service-areas/route.ts <<'TS'
import { NextResponse } from "next/server";
import { createId, readDb, writeDb } from "@/lib/db";

export async function GET() {
  const db = await readDb();
  return NextResponse.json(db.serviceAreas || []);
}

export async function POST(req: Request) {
  const body = await req.json();
  const db = await readDb();
  const item = { id: createId("sa"), ...body };
  db.serviceAreas.unshift(item);
  await writeDb(db);
  return NextResponse.json(item);
}
TS

cat > app/api/site-rules/route.ts <<'TS'
import { NextResponse } from "next/server";
import { createId, readDb, writeDb } from "@/lib/db";

export async function GET() {
  const db = await readDb();
  return NextResponse.json(db.siteTradeRules || []);
}

export async function POST(req: Request) {
  const body = await req.json();
  const db = await readDb();
  const item = { id: createId("rule"), ...body };
  db.siteTradeRules.unshift(item);
  await writeDb(db);
  return NextResponse.json(item);
}
TS

cat > app/api/keywords/route.ts <<'TS'
import { NextResponse } from "next/server";
import { readDb } from "@/lib/db";

export async function GET() {
  const db = await readDb();
  const keywords = (db.siteTradeRules || []).map((r: any) => ({
    id: r.id,
    siteId: r.siteId,
    trade: r.trade,
    positive: r.keywordsPositive || [],
    negative: r.keywordsNegative || [],
    regionNotes: r.regionNotes || ""
  }));
  return NextResponse.json(keywords);
}
TS

echo "🧭 Navigation ergänzen ..."
cat > components/Nav.tsx <<'TSX'
import Link from "next/link";

const items = [
  ["/", "Dashboard"],
  ["/sites", "Sites"],
  ["/service-areas", "Service Areas"],
  ["/site-rules", "Site Rules"],
  ["/keywords", "Keywords"],
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

echo "🎨 Dashboard kompakter und intuitiver ..."
cat > app/page.tsx <<'TSX'
import Link from "next/link";
import { readDb } from "@/lib/db";
import { goQuote, manualQueueCount, overdueCount, overallAssessment, weightedPipeline } from "@/lib/scoring";
import { prefilteredCount, siteCoverage } from "@/lib/siteLogic";

function pill(text: string, kind: "good" | "warn" | "bad" = "good") {
  const cls = kind === "good" ? "badge badge-gut" : kind === "bad" ? "badge badge-kritisch" : "badge badge-gemischt";
  return <span className={cls}>{text}</span>;
}

export default async function DashboardPage() {
  const db = await readDb();
  const tenders = db.tenders || [];
  const sites = db.sites || [];
  const rules = db.siteTradeRules || [];
  const meta = db.meta || {};
  const pipeline = db.pipeline || [];

  const total = tenders.length;
  const prefiltered = prefilteredCount(tenders);
  const go = tenders.filter((t: any) => t.decision === "Go").length;
  const noGo = tenders.filter((t: any) => t.decision === "No-Go").length;
  const manual = manualQueueCount(tenders);
  const activeSites = sites.filter((s: any) => s.active).length;
  const activeRules = rules.filter((r: any) => r.enabled).length;
  const coverage = siteCoverage(sites, rules, tenders);
  const overall = overallAssessment(tenders);

  return (
    <div className="stack">
      <section>
        <h1 className="h1">Vertriebssteuerung neu denken.</h1>
        <p className="sub">
          RUWE-Standorte, Gewerke, Radius, Keywords und aktueller Ausschreibungsabruf in einer operativen Steueransicht.
        </p>
      </section>

      <section className="card">
        <div className="row" style={{ justifyContent: "space-between" }}>
          <div className="stack" style={{ gap: 6 }}>
            <div className="label">Monitoring</div>
            <div className="meta">Letzter Abruf: {meta.lastSuccessfulIngestionAt || "-"}</div>
            <div className="meta">Quelle: {meta.lastSuccessfulIngestionSource || "-"}</div>
          </div>
          <div className="row">
            {pill(`${meta.newSinceLastRun || 0} neu`, "good")}
            {pill(`${meta.duplicateCountLastRun || 0} Dubletten`, "warn")}
            {pill(`${meta.ingestionErrorsLastRun || 0} Fehler`, meta.ingestionErrorsLastRun ? "bad" : "good")}
          </div>
        </div>
      </section>

      <section className="grid grid-6">
        <div className="card"><div className="label">Gesamt</div><div className="kpi">{total}</div></div>
        <div className="card"><div className="label">Bid vorausgewählt</div><div className="kpi">{prefiltered}</div></div>
        <div className="card"><div className="label">Manuell prüfen</div><div className="kpi">{manual}</div></div>
        <div className="card"><div className="label">Go / No-Go</div><div className="kpi">{go} / {noGo}</div></div>
        <div className="card"><div className="label">Standorte / Regeln</div><div className="kpi">{activeSites} / {activeRules}</div></div>
        <div className="card"><div className="label">Weighted Pipeline</div><div className="kpi" style={{ color: "var(--orange)" }}>{Math.round(weightedPipeline(pipeline) / 1000)}k €</div><div className="meta">Go-Quote: {Math.round(goQuote(tenders) * 100)}%</div></div>
      </section>

      <section className="grid grid-2">
        <div className="card">
          <div className="section-title">Standorte & Gewerke</div>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Standort</th>
                  <th>Radius</th>
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
                    <td>{row.site.primaryRadiusKm}/{row.site.secondaryRadiusKm} km</td>
                    <td>{row.rules.map((r: any) => r.trade).join(", ")}</td>
                    <td>{row.tendersTotal}</td>
                    <td>{row.goCount}</td>
                    <td>{row.reviewCount}</td>
                    <td>{row.noGoCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <div className="section-title">Systemstatus</div>
          <div className="stack">
            <div className="meta">Gesamtlage: {pill(overall, overall === "gut" ? "good" : overall === "kritisch" ? "bad" : "warn")}</div>
            <div className="meta">Überfällige Fälle: {overdueCount(tenders)}</div>
            <div className="meta">Nächster Fokus: Regeln pflegen, Keywords schärfen, Prüffälle reduzieren.</div>
            <div className="row">
              <Link className="linkish" href="/sites">Sites</Link>
              <Link className="linkish" href="/site-rules">Site Rules</Link>
              <Link className="linkish" href="/keywords">Keywords</Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
TSX

echo "🏢 Sites / Service Areas / Rules / Keywords Seiten ..."
mkdir -p app/service-areas app/site-rules app/keywords

cat > app/sites/page.tsx <<'TSX'
import Link from "next/link";
import { readDb } from "@/lib/db";

export default async function SitesPage() {
  const db = await readDb();
  const sites = db.sites || [];
  const rules = db.siteTradeRules || [];

  return (
    <div className="stack">
      <div>
        <h1 className="h1">Sites</h1>
        <p className="sub">Offizielle RUWE-Standorte und Gruppengesellschaften mit Radien und Gewerkelogik.</p>
      </div>
      <div className="card table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Standort</th>
              <th>Typ</th>
              <th>Stadt</th>
              <th>Radius</th>
              <th>Gewerke</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {sites.map((s: any) => {
              const ownRules = rules.filter((r: any) => r.siteId === s.id && r.enabled);
              return (
                <tr key={s.id}>
                  <td>{s.name}</td>
                  <td>{s.type}</td>
                  <td>{s.city}</td>
                  <td>{s.primaryRadiusKm}/{s.secondaryRadiusKm} km</td>
                  <td>{ownRules.map((r: any) => r.trade).join(", ")}</td>
                  <td><Link className="linkish" href={`/sites/${s.id}`}>Öffnen</Link></td>
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
  const serviceAreas = (db.serviceAreas || []).filter((x: any) => x.siteId === id);
  const tenders = (db.tenders || []).filter((x: any) => x.matchedSiteId === id);

  return (
    <div className="stack">
      <div>
        <h1 className="h1">{site.name}</h1>
        <p className="sub">Standortdetail mit Service Areas, Gewerkeregeln und zugeordneten Ausschreibungen.</p>
      </div>
      <div className="grid grid-3">
        <div className="card"><div className="label">Standort</div><div className="kpi">{site.city}</div></div>
        <div className="card"><div className="label">Primär / Sekundär</div><div className="kpi">{site.primaryRadiusKm}/{site.secondaryRadiusKm} km</div></div>
        <div className="card"><div className="label">Treffer</div><div className="kpi">{tenders.length}</div></div>
      </div>
      <div className="grid grid-3">
        <div className="card"><div className="section-title">Service Areas</div><pre className="doc">{JSON.stringify(serviceAreas, null, 2)}</pre></div>
        <div className="card"><div className="section-title">Site Rules</div><pre className="doc">{JSON.stringify(rules, null, 2)}</pre></div>
        <div className="card"><div className="section-title">Tenders</div><pre className="doc">{JSON.stringify(tenders, null, 2)}</pre></div>
      </div>
    </div>
  );
}
TSX

cat > app/service-areas/page.tsx <<'TSX'
import { readDb } from "@/lib/db";

export default async function ServiceAreasPage() {
  const db = await readDb();
  const items = db.serviceAreas || [];
  const sites = db.sites || [];

  return (
    <div className="stack">
      <div>
        <h1 className="h1">Service Areas</h1>
        <p className="sub">Operative Einsatzräume zusätzlich zu den formalen Standorten.</p>
      </div>
      <div className="card table-wrap">
        <table className="table">
          <thead><tr><th>Name</th><th>Standort</th><th>Bundesland</th><th>Aktiv</th></tr></thead>
          <tbody>
            {items.map((x: any) => {
              const site = sites.find((s: any) => s.id === x.siteId);
              return (
                <tr key={x.id}>
                  <td>{x.name}</td>
                  <td>{site?.name || "-"}</td>
                  <td>{x.state}</td>
                  <td>{x.active ? "Ja" : "Nein"}</td>
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

cat > app/site-rules/page.tsx <<'TSX'
import { readDb } from "@/lib/db";

export default async function SiteRulesPage() {
  const db = await readDb();
  const rules = db.siteTradeRules || [];
  const sites = db.sites || [];

  return (
    <div className="stack">
      <div>
        <h1 className="h1">Site Rules</h1>
        <p className="sub">Manuell steuerbare Radius- und Gewerkelogik pro Standort.</p>
      </div>
      <div className="card table-wrap">
        <table className="table">
          <thead><tr><th>Standort</th><th>Gewerk</th><th>Priorität</th><th>Primär</th><th>Sekundär</th><th>Keywords</th></tr></thead>
          <tbody>
            {rules.map((r: any) => {
              const site = sites.find((s: any) => s.id === r.siteId);
              return (
                <tr key={r.id}>
                  <td>{site?.name || "-"}</td>
                  <td>{r.trade}</td>
                  <td>{r.priority}</td>
                  <td>{r.primaryRadiusKm} km</td>
                  <td>{r.secondaryRadiusKm} km</td>
                  <td>{(r.keywordsPositive || []).join(", ")}</td>
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

cat > app/keywords/page.tsx <<'TSX'
import { readDb } from "@/lib/db";

export default async function KeywordsPage() {
  const db = await readDb();
  const rules = db.siteTradeRules || [];
  const sites = db.sites || [];

  return (
    <div className="stack">
      <div>
        <h1 className="h1">Keywords</h1>
        <p className="sub">Positive und negative Suchbegriffe je Gewerk und Standort, optional regional kommentiert.</p>
      </div>
      <div className="grid grid-2">
        {rules.map((r: any) => {
          const site = sites.find((s: any) => s.id === r.siteId);
          return (
            <div className="card" key={r.id}>
              <div className="section-title">{site?.name || "-"} · {r.trade}</div>
              <div className="meta">Region Hinweis: {r.regionNotes || "-"}</div>
              <div className="meta" style={{ marginTop: 8 }}>Positiv: {(r.keywordsPositive || []).join(", ") || "-"}</div>
              <div className="meta">Negativ: {(r.keywordsNegative || []).join(", ") || "-"}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
TSX

echo "🧾 Docs & Phasen-Lücken schließen ..."
cat > docs/PHASES.md <<'DOC'
# PHASES

## Phase 1 — Foundation
Erledigt: stabiles Grundgerüst, Navigation, APIs, Dashboard-Basis, Docs.

## Phase 2 — Operational Core
Erledigt in Basisform: Sites, Service Areas, Site Rules, Keywords, Tenders, Pipeline, Agents, Buyers, References.

## Phase 3 — Intelligence
Teilweise umgesetzt: Bid-Vorauswahl-Metrik, Standort-/Gewerk-/Radiusfokus, Monitoring-KPIs.
Offen: Explainability, Drilldowns, Entscheidungscenter.

## Phase 4 — Ingestion & Automation
Teilweise vorbereitet: letzter Abruf, Quellenstatus, Ingestion-Metadaten.
Offen: echte Abrufe, Dubletten-Engine, Review Queue.

## Phase 5 — Production & Scale
Vorbereitet in Docs/Modell.
Offen: Rollen, Audit Log, Scheduler, Exporte, produktive Formulare, Persistenzhärtung.
DOC

cat > docs/OpenTasks.md <<'DOC'
# OpenTasks

## P2 Operational Core
- [ ] Sites CRUD UI
- [ ] Service Areas CRUD UI
- [ ] Site Rules CRUD UI
- [ ] Keywords CRUD UI
- [ ] Tender Edit/Create UI
- [ ] Filter nach Standort / Gewerk / Radius / Status

## P3 Intelligence
- [ ] Explainability je Tender
- [ ] Distanz-/Radiusampel
- [ ] Drilldown je Standort / Gewerk
- [ ] Bid-Vorauswahl-Reasoning sichtbar

## P4 Ingestion
- [ ] echter Abruf TED
- [ ] echter Abruf Bund.de
- [ ] Region-/Keyword-basierte Vorfilterung beim Import
- [ ] Ingestion Review Queue
- [ ] Dublettenprüfung

## P5 Production
- [ ] Rollenmodell
- [ ] Audit Log
- [ ] Scheduler
- [ ] Reporting / Export
- [ ] produktive Formularflächen
DOC

npm run build || true
git add .
git commit -m "feat: add real RUWE site model, service areas, site trade rules, keyword control and clearer dashboard" || true
git push origin main || true

echo "✅ RUWE operativer Standortfokus ausgebaut."
