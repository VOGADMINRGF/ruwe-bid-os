#!/bin/bash
set -e

cd "$(pwd)"

echo "🚀 RUWE Bid OS — Capacity, Radius Classes & Monitoring Upgrade"

mkdir -p app/dashboard/monitoring
mkdir -p app/dashboard/prefiltered
mkdir -p app/dashboard/manual-review
mkdir -p app/dashboard/go-no-go
mkdir -p app/dashboard/coverage
mkdir -p app/site-rules/[id]
mkdir -p docs lib data

echo "📦 Datenmodell auf Standort × Gewerk × Radius × Kapazität erweitern ..."
cat > data/db.json <<'JSON'
{
  "meta": {
    "appName": "RUWE Bid OS",
    "version": "capacity-monitoring-upgrade",
    "lastSeededAt": "2026-04-08T23:45:00.000Z",
    "lastSuccessfulIngestionAt": "2026-04-08T22:45:00.000Z",
    "lastSuccessfulIngestionSource": "TED Europa / Bund.de Aggregation",
    "pollingSeconds": 60
  },
  "sourceStats": [
    {
      "id": "src1",
      "name": "TED Europa",
      "lastFetchAt": "2026-04-08T22:45:00.000Z",
      "tendersLast30Days": 24,
      "tendersSinceLastFetch": 4,
      "prefilteredLast30Days": 9,
      "goLast30Days": 3,
      "errorCountLastRun": 0,
      "duplicateCountLastRun": 1
    },
    {
      "id": "src2",
      "name": "Bund.de",
      "lastFetchAt": "2026-04-08T21:55:00.000Z",
      "tendersLast30Days": 17,
      "tendersSinceLastFetch": 2,
      "prefilteredLast30Days": 6,
      "goLast30Days": 2,
      "errorCountLastRun": 0,
      "duplicateCountLastRun": 0
    },
    {
      "id": "src3",
      "name": "DTVP",
      "lastFetchAt": "2026-04-08T20:30:00.000Z",
      "tendersLast30Days": 11,
      "tendersSinceLastFetch": 1,
      "prefilteredLast30Days": 2,
      "goLast30Days": 0,
      "errorCountLastRun": 1,
      "duplicateCountLastRun": 0
    }
  ],
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
      "notes": "Ost-Fokus."
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
      "notes": "Brandenburg-Achse."
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
      "notes": "Sachsen-Anhalt/Südost."
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
  "siteTradeRules": [
    {
      "id": "rule1",
      "siteId": "site_berlin",
      "trade": "Sicherheit",
      "priority": "hoch",
      "primaryRadiusKm": 25,
      "secondaryRadiusKm": 35,
      "tertiaryRadiusKm": 50,
      "monthlyCapacity": 8,
      "concurrentCapacity": 3,
      "enabled": true,
      "keywordsPositive": ["objektschutz", "wachschutz", "sicherheitsdienst"],
      "keywordsNegative": ["bundeswehr", "flughafen-großauftrag"],
      "regionNotes": "Berlin selektiv"
    },
    {
      "id": "rule2",
      "siteId": "site_berlin",
      "trade": "Facility",
      "priority": "mittel",
      "primaryRadiusKm": 20,
      "secondaryRadiusKm": 30,
      "tertiaryRadiusKm": 45,
      "monthlyCapacity": 5,
      "concurrentCapacity": 2,
      "enabled": true,
      "keywordsPositive": ["facility", "objektservice", "hausmeister"],
      "keywordsNegative": ["tgm-komplex"],
      "regionNotes": "Nur selektiv"
    },
    {
      "id": "rule3",
      "siteId": "site_torgau",
      "trade": "Facility",
      "priority": "hoch",
      "primaryRadiusKm": 45,
      "secondaryRadiusKm": 70,
      "tertiaryRadiusKm": 90,
      "monthlyCapacity": 14,
      "concurrentCapacity": 6,
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
      "tertiaryRadiusKm": 95,
      "monthlyCapacity": 18,
      "concurrentCapacity": 8,
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
      "tertiaryRadiusKm": 75,
      "monthlyCapacity": 6,
      "concurrentCapacity": 2,
      "enabled": true,
      "keywordsPositive": ["sicherheitsdienst", "objektschutz"],
      "keywordsNegative": [],
      "regionNotes": "bei Fit"
    },
    {
      "id": "rule6",
      "siteId": "site_zeitz",
      "trade": "Reinigung",
      "priority": "hoch",
      "primaryRadiusKm": 40,
      "secondaryRadiusKm": 60,
      "tertiaryRadiusKm": 80,
      "monthlyCapacity": 12,
      "concurrentCapacity": 5,
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
      "tertiaryRadiusKm": 75,
      "monthlyCapacity": 10,
      "concurrentCapacity": 4,
      "enabled": true,
      "keywordsPositive": ["hausmeister", "objektbetreuung"],
      "keywordsNegative": [],
      "regionNotes": "kommunal"
    },
    {
      "id": "rule8",
      "siteId": "site_strausberg",
      "trade": "Sicherheit",
      "priority": "mittel",
      "primaryRadiusKm": 30,
      "secondaryRadiusKm": 50,
      "tertiaryRadiusKm": 70,
      "monthlyCapacity": 5,
      "concurrentCapacity": 2,
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
    { "id": "b4", "name": "Landratsamt Altenburg", "type": "öffentlich", "strategic": true },
    { "id": "b5", "name": "Land Brandenburg", "type": "öffentlich", "strategic": false }
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
      "sourceType": "TED Europa",
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
      "sourceType": "Bund.de",
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
      "sourceType": "TED Europa",
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
      "sourceType": "Bund.de",
      "ingestedAt": "2026-04-08T22:43:00.000Z",
      "distanceKm": 17,
      "matchedSiteId": "site_zeitz",
      "prefilteredForBid": true,
      "sourceKeywords": ["hausmeister", "objektbetreuung"]
    },
    {
      "id": "t5",
      "title": "Wachdienst Brandenburg Nord",
      "region": "Brandenburg Nord",
      "trade": "Sicherheit",
      "buyerId": "b5",
      "ownerId": "",
      "priority": "B",
      "decision": "No-Go",
      "status": "beobachten",
      "manualReview": "optional",
      "fitSummary": "mittel",
      "riskLevel": "mittel",
      "estimatedValue": 480000,
      "dueDate": "2026-04-27",
      "sourceType": "DTVP",
      "ingestedAt": "2026-04-08T22:44:00.000Z",
      "distanceKm": 62,
      "matchedSiteId": "site_strausberg",
      "prefilteredForBid": false,
      "sourceKeywords": ["wachdienst", "objektschutz"]
    },
    {
      "id": "t6",
      "title": "Reinigung regionaler Verwaltungsverbund",
      "region": "Sachsen Ost",
      "trade": "Reinigung",
      "buyerId": "b1",
      "ownerId": "",
      "priority": "B",
      "decision": "Prüfen",
      "status": "beobachten",
      "manualReview": "optional",
      "fitSummary": "mittel",
      "riskLevel": "mittel",
      "estimatedValue": 730000,
      "dueDate": "2026-04-28",
      "sourceType": "TED Europa",
      "ingestedAt": "2026-04-08T22:44:30.000Z",
      "distanceKm": 82,
      "matchedSiteId": "site_torgau",
      "prefilteredForBid": false,
      "sourceKeywords": ["gebäudereinigung", "sonderreinigung"]
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
  ]
}
JSON

echo "🧠 Standort-/Regellogik vertiefen ..."
cat > lib/siteLogic.ts <<'TS'
export function prefilteredCount(tenders: any[]) {
  return tenders.filter((t) => t.prefilteredForBid).length;
}

export function classifyRadiusBand(distanceKm: number, rule: any) {
  if (distanceKm <= rule.primaryRadiusKm) return "primary";
  if (distanceKm <= rule.secondaryRadiusKm) return "secondary";
  if (distanceKm <= rule.tertiaryRadiusKm) return "tertiary";
  return "outside";
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

export function siteTradeOperationalRows(site: any, rules: any[], tenders: any[]) {
  const ownRules = rules.filter((r) => r.siteId === site.id && r.enabled);

  return ownRules.map((rule) => {
    const tradeTenders = tenders.filter((t) => t.trade === rule.trade && t.matchedSiteId === site.id);

    const primary = tradeTenders.filter((t) => classifyRadiusBand(t.distanceKm ?? 9999, rule) === "primary").length;
    const secondary = tradeTenders.filter((t) => classifyRadiusBand(t.distanceKm ?? 9999, rule) === "secondary").length;
    const tertiary = tradeTenders.filter((t) => classifyRadiusBand(t.distanceKm ?? 9999, rule) === "tertiary").length;

    const currentScope = tradeTenders.filter((t) => {
      const band = classifyRadiusBand(t.distanceKm ?? 9999, rule);
      return band === "primary" || band === "secondary";
    });

    const nextBand = tradeTenders.filter((t) => classifyRadiusBand(t.distanceKm ?? 9999, rule) === "tertiary");
    const nextBandManualCandidates = nextBand.filter((t) => t.decision !== "Go");

    return {
      rule,
      primary,
      secondary,
      tertiary,
      currentScopeCount: currentScope.length,
      nextBandCount: nextBand.length,
      nextBandManualCandidates: nextBandManualCandidates.length,
      monthlyCapacity: rule.monthlyCapacity,
      concurrentCapacity: rule.concurrentCapacity,
      capacityStatus:
        currentScope.length >= rule.monthlyCapacity
          ? "voll"
          : currentScope.length >= Math.max(1, Math.floor(rule.monthlyCapacity * 0.7))
            ? "eng"
            : "frei"
    };
  });
}
TS

echo "📊 Dashboard klickbar und intuitiver ..."
cat > app/page.tsx <<'TSX'
import Link from "next/link";
import { readDb } from "@/lib/db";
import { goQuote, manualQueueCount, overdueCount, overallAssessment, weightedPipeline } from "@/lib/scoring";
import { prefilteredCount, siteCoverage } from "@/lib/siteLogic";

function pill(text: string, kind: "good" | "warn" | "bad" = "good") {
  const cls = kind === "good" ? "badge badge-gut" : kind === "bad" ? "badge badge-kritisch" : "badge badge-gemischt";
  return <span className={cls}>{text}</span>;
}

function KpiCard({
  href,
  label,
  value,
  sub
}: {
  href: string;
  label: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <Link href={href} className="card" style={{ display: "block" }}>
      <div className="label">{label}</div>
      <div className="kpi">{value}</div>
      {sub ? <div className="meta" style={{ marginTop: 8 }}>{sub}</div> : null}
    </Link>
  );
}

export default async function DashboardPage() {
  const db = await readDb();
  const tenders = db.tenders || [];
  const sites = db.sites || [];
  const rules = db.siteTradeRules || [];
  const sourceStats = db.sourceStats || [];
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
  const bestSource = [...sourceStats].sort((a: any, b: any) => (b.prefilteredLast30Days || 0) - (a.prefilteredLast30Days || 0))[0];

  return (
    <div className="stack">
      <section>
        <h1 className="h1">Vertriebssteuerung neu denken.</h1>
        <p className="sub">
          Standort-, Gewerk-, Radius- und Keyword-gesteuerte Steuerzentrale für RUWE inkl. Monitoring und Bid-Vorauswahl.
        </p>
      </section>

      <section className="card">
        <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
          <div className="stack" style={{ gap: 6 }}>
            <div className="label">Monitoring Schnellblick</div>
            <div className="meta">Letzter Abruf: {meta.lastSuccessfulIngestionAt || "-"}</div>
            <div className="meta">Letzte Quelle: {meta.lastSuccessfulIngestionSource || "-"}</div>
            <div className="meta">Sinnvollste Quelle zuletzt: {bestSource?.name || "-"}</div>
          </div>
          <div className="row">
            {pill(`${sourceStats.reduce((sum: number, s: any) => sum + (s.tendersSinceLastFetch || 0), 0)} neu`, "good")}
            {pill(`${sourceStats.reduce((sum: number, s: any) => sum + (s.duplicateCountLastRun || 0), 0)} Dubletten`, "warn")}
            {pill(`${sourceStats.reduce((sum: number, s: any) => sum + (s.errorCountLastRun || 0), 0)} Fehler`, sourceStats.reduce((sum: number, s: any) => sum + (s.errorCountLastRun || 0), 0) ? "bad" : "good")}
            <Link className="linkish" href="/dashboard/monitoring">Details</Link>
          </div>
        </div>
      </section>

      <section className="grid grid-6">
        <KpiCard href="/dashboard/monitoring" label="Gesamt" value={total} sub="Alle registrierten Ausschreibungen" />
        <KpiCard href="/dashboard/prefiltered" label="Bid vorausgewählt" value={prefiltered} sub="Innerhalb aktiver Regeln" />
        <KpiCard href="/dashboard/manual-review" label="Manuell prüfen" value={manual} sub="Offene Review-Fälle" />
        <KpiCard href="/dashboard/go-no-go" label="Go / No-Go" value={`${go} / ${noGo}`} sub="Entscheidungsstand" />
        <KpiCard href="/dashboard/coverage" label="Standorte / Regeln" value={`${activeSites} / ${activeRules}`} sub="Aktive Abdeckung" />
        <KpiCard href="/pipeline" label="Weighted Pipeline" value={`${Math.round(weightedPipeline(pipeline) / 1000)}k €`} sub={`Go-Quote: ${Math.round(goQuote(tenders) * 100)}%`} />
      </section>

      <section className="grid grid-2">
        <div className="card">
          <div className="section-title">Quellen & Nutzen</div>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Quelle</th>
                  <th>Letzter Abruf</th>
                  <th>letzter Monat</th>
                  <th>seit letztem Abruf</th>
                  <th>vorausgewählt</th>
                  <th>Go</th>
                </tr>
              </thead>
              <tbody>
                {sourceStats.map((s: any) => (
                  <tr key={s.id}>
                    <td>{s.name}</td>
                    <td>{s.lastFetchAt}</td>
                    <td>{s.tendersLast30Days}</td>
                    <td>{s.tendersSinceLastFetch}</td>
                    <td>{s.prefilteredLast30Days}</td>
                    <td>{s.goLast30Days}</td>
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
            <div className="meta">Nächster Fokus: Site Rules und Keywords schärfen, Kapazitäten justieren, Prüffälle senken.</div>
            <div className="row">
              <Link className="linkish" href="/sites">Sites</Link>
              <Link className="linkish" href="/site-rules">Site Rules</Link>
              <Link className="linkish" href="/keywords">Keywords</Link>
              <Link className="linkish" href="/dashboard/coverage">Coverage</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="card">
        <div className="section-title">Standorte × Gewerke × Kapazität</div>
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
      </section>
    </div>
  );
}
TSX

echo "🏢 Standort-Detail auf echte Steuerlogik heben ..."
cat > app/sites/[id]/page.tsx <<'TSX'
import { notFound } from "next/navigation";
import { readDb } from "@/lib/db";
import { siteTradeOperationalRows } from "@/lib/siteLogic";

function capacityBadge(status: string) {
  if (status === "voll") return "badge badge-kritisch";
  if (status === "eng") return "badge badge-gemischt";
  return "badge badge-gut";
}

export default async function SiteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = await readDb();
  const site = (db.sites || []).find((x: any) => x.id === id);
  if (!site) return notFound();

  const rules = db.siteTradeRules || [];
  const serviceAreas = (db.serviceAreas || []).filter((x: any) => x.siteId === id);
  const tenders = db.tenders || [];
  const rows = siteTradeOperationalRows(site, rules, tenders);

  return (
    <div className="stack">
      <div>
        <h1 className="h1">{site.name}</h1>
        <p className="sub">
          Standortdetail mit konfigurierbaren Gewerken, Radiusstufen, Kapazitäten und nächstgrößerer Klasse.
        </p>
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-2">
        <div className="card">
          <div className="section-title">Keywords & Hinweise</div>
          <pre className="doc">{JSON.stringify(rows.map((r: any) => ({
            trade: r.rule.trade,
            priority: r.rule.priority,
            positive: r.rule.keywordsPositive,
            negative: r.rule.keywordsNegative,
            regionNotes: r.rule.regionNotes
          })), null, 2)}</pre>
        </div>

        <div className="card">
          <div className="section-title">Interpretation</div>
          <div className="stack">
            <div className="meta">„Im Scope“ = Primär + Sekundär, also aktuell aktiv gespielter Suchraum.</div>
            <div className="meta">„Nächste Klasse“ = Tertiärband oberhalb des aktuellen Suchraums.</div>
            <div className="meta">„Manuell prüfen“ = potenzielle zusätzliche Chancen bei Radiuserweiterung.</div>
          </div>
        </div>
      </div>
    </div>
  );
}
TSX

echo "📚 Drilldown-Seiten fürs Dashboard ..."
cat > app/dashboard/monitoring/page.tsx <<'TSX'
import { readDb } from "@/lib/db";

export default async function MonitoringPage() {
  const db = await readDb();
  const stats = db.sourceStats || [];
  return (
    <div className="stack">
      <div>
        <h1 className="h1">Monitoring</h1>
        <p className="sub">Quellenleistung, letzter Abruf und Nutzen pro Anbieter.</p>
      </div>
      <div className="card table-wrap">
        <table className="table">
          <thead><tr><th>Quelle</th><th>Letzter Abruf</th><th>letzter Monat</th><th>seit letztem Abruf</th><th>vorausgewählt</th><th>Go</th><th>Fehler</th></tr></thead>
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
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
TSX

cat > app/dashboard/prefiltered/page.tsx <<'TSX'
import Link from "next/link";
import { readDb } from "@/lib/db";

export default async function PrefilteredPage() {
  const db = await readDb();
  const items = (db.tenders || []).filter((t: any) => t.prefilteredForBid);
  return (
    <div className="stack">
      <div><h1 className="h1">Bid vorausgewählt</h1><p className="sub">Alle Tenders innerhalb aktiver Regeln.</p></div>
      <div className="card table-wrap">
        <table className="table">
          <thead><tr><th>Titel</th><th>Standort</th><th>Gewerk</th><th>Distanz</th><th>Entscheidung</th></tr></thead>
          <tbody>
            {items.map((t: any) => (
              <tr key={t.id}>
                <td><Link className="linkish" href={`/tenders/${t.id}`}>{t.title}</Link></td>
                <td>{t.matchedSiteId}</td>
                <td>{t.trade}</td>
                <td>{t.distanceKm} km</td>
                <td>{t.decision}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
TSX

cat > app/dashboard/manual-review/page.tsx <<'TSX'
import Link from "next/link";
import { readDb } from "@/lib/db";

export default async function ManualReviewPage() {
  const db = await readDb();
  const items = (db.tenders || []).filter((t: any) => t.manualReview === "zwingend" || t.decision === "Prüfen");
  return (
    <div className="stack">
      <div><h1 className="h1">Manuell prüfen</h1><p className="sub">Review-pflichtige und offene Entscheidungsfälle.</p></div>
      <div className="card table-wrap">
        <table className="table">
          <thead><tr><th>Titel</th><th>Standort</th><th>Gewerk</th><th>Frist</th><th>Status</th></tr></thead>
          <tbody>
            {items.map((t: any) => (
              <tr key={t.id}>
                <td><Link className="linkish" href={`/tenders/${t.id}`}>{t.title}</Link></td>
                <td>{t.matchedSiteId}</td>
                <td>{t.trade}</td>
                <td>{t.dueDate}</td>
                <td>{t.decision}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
TSX

cat > app/dashboard/go-no-go/page.tsx <<'TSX'
import { readDb } from "@/lib/db";

export default async function GoNoGoPage() {
  const db = await readDb();
  const tenders = db.tenders || [];
  return (
    <div className="stack">
      <div><h1 className="h1">Go / No-Go</h1><p className="sub">Entscheidungsverteilung der aktuellen Tenders.</p></div>
      <div className="card">
        <pre className="doc">{JSON.stringify({
          go: tenders.filter((t: any) => t.decision === "Go"),
          pruefen: tenders.filter((t: any) => t.decision === "Prüfen"),
          noGo: tenders.filter((t: any) => t.decision === "No-Go")
        }, null, 2)}</pre>
      </div>
    </div>
  );
}
TSX

cat > app/dashboard/coverage/page.tsx <<'TSX'
import { readDb } from "@/lib/db";
import { siteCoverage } from "@/lib/siteLogic";

export default async function CoveragePage() {
  const db = await readDb();
  const coverage = siteCoverage(db.sites || [], db.siteTradeRules || [], db.tenders || []);
  return (
    <div className="stack">
      <div><h1 className="h1">Coverage</h1><p className="sub">Abdeckung über aktive Sites und Regeln.</p></div>
      <div className="card">
        <pre className="doc">{JSON.stringify(coverage, null, 2)}</pre>
      </div>
    </div>
  );
}
TSX

echo "🧾 Docs auf neue Tiefe bringen ..."
cat > docs/CURRENT_STATE.md <<'DOC'
# CURRENT_STATE

## Stand
Das System ist jetzt auf Standort × Gewerk × Radius × Kapazität × Keywords ausgerichtet.

## Bereits enthalten
- Sites
- Service Areas
- SiteTradeRules
- positive/negative Keywords
- Dashboard mit klickbaren KPI-Karten
- Monitoring-Nutzen pro Quelle
- Standortdetail mit nächstgrößerer Radiusklasse
- Sicht auf potenziell verpasste Ausschreibungen im erweiterten Radiusband

## Noch offen
- echte CRUD-Formulare
- echte Radius-/Keyword-Editoren
- echte Importjobs
- Explainability pro Tender
- Statuswechsel direkt in UI
DOC

cat > docs/OpenTasks.md <<'DOC'
# OpenTasks

## P2 Operational Core
- [ ] CRUD UI für Sites
- [ ] CRUD UI für Site Rules
- [ ] CRUD UI für Keywords
- [ ] CRUD UI für Service Areas
- [ ] Filter nach Standort / Gewerk / Radiusband / Quelle / Status
- [ ] Tender-Status direkt aus UI ändern

## P3 Intelligence
- [ ] Explainability je Tender
- [ ] Radiusampel primär/sekundär/tertiär
- [ ] Kapazitätswarnungen visualisieren
- [ ] automatische Vorschläge für Radiuserweiterung
- [ ] Keyword-Effektivität je Standort/Gewerk

## P4 Ingestion
- [ ] echter Abruf TED
- [ ] echter Abruf Bund.de
- [ ] echter Abruf DTVP
- [ ] Import Review Queue
- [ ] Dubletten-Engine
- [ ] Quellen-Nutzwert automatisch berechnen

## P5 Production
- [ ] Rollenmodell
- [ ] Audit Log
- [ ] Scheduler
- [ ] Reporting / Export
- [ ] produktive Formularoberflächen
- [ ] Persistenz-Härtung
DOC

npm run build || true
git add .
git commit -m "feat: add capacity-aware site rules, missed next-band opportunities, clickable dashboard and source usefulness view" || true
git push origin main || true

echo "✅ Kapazität, Radiusklassen und Monitoring-Nutzen eingebaut."
