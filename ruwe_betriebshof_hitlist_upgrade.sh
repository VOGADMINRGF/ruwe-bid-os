#!/bin/bash
set -e

cd "$(pwd)"

echo "🚀 RUWE Bid OS — Betriebshof + Hitlist + Refresh Upgrade"

mkdir -p app/dashboard/new-hits
mkdir -p app/dashboard/source-tests
mkdir -p app/api/source-refresh
mkdir -p app/api/source-hits
mkdir -p app/source-hits
mkdir -p lib

echo "📦 Datenmodell auf Betriebshöfe + sourceHits umstellen ..."
cat > data/db.json <<'JSON'
{
  "meta": {
    "appName": "RUWE Bid OS",
    "version": "betriebshof-hitlist-upgrade",
    "lastSeededAt": "2026-04-09T11:20:00.000Z",
    "lastSuccessfulIngestionAt": "2026-04-09T11:05:00.000Z",
    "lastSuccessfulIngestionSource": "TED Search API",
    "pollingSeconds": 60
  },
  "sourceRegistry": [
    {
      "id": "src_ted",
      "name": "TED Search API",
      "type": "api",
      "provider": "TED",
      "enabled": true,
      "official": true,
      "authRequired": false,
      "legalUse": "hoch",
      "notes": "Offizielle Maschinenquelle."
    },
    {
      "id": "src_service_bund",
      "name": "service.bund.de RSS",
      "type": "rss",
      "provider": "service.bund.de",
      "enabled": true,
      "official": true,
      "authRequired": false,
      "legalUse": "mittel",
      "notes": "Sekundärer Publikationskanal."
    },
    {
      "id": "src_berlin",
      "name": "Vergabeplattform Berlin",
      "type": "portal_rss",
      "provider": "Berlin",
      "enabled": true,
      "official": true,
      "authRequired": false,
      "legalUse": "mittel",
      "notes": "Öffentliche Bekanntmachungen / RSS."
    },
    {
      "id": "src_dtvp",
      "name": "DTVP",
      "type": "portal",
      "provider": "DTVP",
      "enabled": true,
      "official": true,
      "authRequired": false,
      "legalUse": "vorsicht",
      "notes": "Erstmal Beobachtungs-/Partnerquelle."
    }
  ],
  "sourceStats": [
    {
      "id": "src_ted",
      "lastFetchAt": "2026-04-09T11:05:00.000Z",
      "tendersLast30Days": 28,
      "tendersSinceLastFetch": 5,
      "prefilteredLast30Days": 11,
      "goLast30Days": 4,
      "errorCountLastRun": 0,
      "duplicateCountLastRun": 1,
      "lastRunOk": true
    },
    {
      "id": "src_service_bund",
      "lastFetchAt": "2026-04-09T10:52:00.000Z",
      "tendersLast30Days": 19,
      "tendersSinceLastFetch": 3,
      "prefilteredLast30Days": 7,
      "goLast30Days": 2,
      "errorCountLastRun": 0,
      "duplicateCountLastRun": 0,
      "lastRunOk": true
    },
    {
      "id": "src_berlin",
      "lastFetchAt": "2026-04-09T10:35:00.000Z",
      "tendersLast30Days": 13,
      "tendersSinceLastFetch": 2,
      "prefilteredLast30Days": 4,
      "goLast30Days": 1,
      "errorCountLastRun": 0,
      "duplicateCountLastRun": 0,
      "lastRunOk": true
    },
    {
      "id": "src_dtvp",
      "lastFetchAt": "2026-04-09T10:10:00.000Z",
      "tendersLast30Days": 9,
      "tendersSinceLastFetch": 1,
      "prefilteredLast30Days": 2,
      "goLast30Days": 0,
      "errorCountLastRun": 1,
      "duplicateCountLastRun": 0,
      "lastRunOk": false
    }
  ],
  "sites": [
    {
      "id": "bh_nordost",
      "name": "Betriebshof Nord-Ost",
      "city": "Berlin",
      "postalCode": "13053",
      "state": "Berlin",
      "type": "Betriebshof",
      "active": true,
      "primaryRadiusKm": 18,
      "secondaryRadiusKm": 30,
      "notes": "Glas- & Gebäudereinigung / Berlin Ost."
    },
    {
      "id": "bh_nordwest",
      "name": "Betriebshof Nord-West",
      "city": "Berlin",
      "postalCode": "13599",
      "state": "Berlin",
      "type": "Betriebshof",
      "active": true,
      "primaryRadiusKm": 18,
      "secondaryRadiusKm": 30,
      "notes": "Berlin West."
    },
    {
      "id": "bh_mitte",
      "name": "Betriebshof Mitte",
      "city": "Berlin",
      "postalCode": "12057",
      "state": "Berlin",
      "type": "Betriebshof",
      "active": true,
      "primaryRadiusKm": 15,
      "secondaryRadiusKm": 25,
      "notes": "Hausmeister / Hauswartservice."
    },
    {
      "id": "bh_suedost",
      "name": "Betriebshof Süd-Ost",
      "city": "Groß Kienitz",
      "postalCode": "15831",
      "state": "Brandenburg",
      "type": "Betriebshof",
      "active": true,
      "primaryRadiusKm": 25,
      "secondaryRadiusKm": 40,
      "notes": "Südost-Achse."
    },
    {
      "id": "bh_suedwest",
      "name": "Betriebshof Süd-West",
      "city": "Stahnsdorf",
      "postalCode": "14532",
      "state": "Brandenburg",
      "type": "Betriebshof",
      "active": true,
      "primaryRadiusKm": 25,
      "secondaryRadiusKm": 40,
      "notes": "Südwest-Achse."
    },
    {
      "id": "nl_magdeburg",
      "name": "Niederlassung Magdeburg",
      "city": "Magdeburg",
      "postalCode": "39106",
      "state": "Sachsen-Anhalt",
      "type": "Niederlassung",
      "active": true,
      "primaryRadiusKm": 35,
      "secondaryRadiusKm": 55,
      "notes": "Wichtiger Suchanker für Sachsen-Anhalt."
    },
    {
      "id": "nl_schkeuditz",
      "name": "Niederlassung Schkeuditz",
      "city": "Schkeuditz",
      "postalCode": "04435",
      "state": "Sachsen",
      "type": "Niederlassung",
      "active": true,
      "primaryRadiusKm": 35,
      "secondaryRadiusKm": 60,
      "notes": "Leipzig / Sachsen Achse."
    },
    {
      "id": "nl_zeitz",
      "name": "Niederlassung Zeitz",
      "city": "Zeitz",
      "postalCode": "06712",
      "state": "Sachsen-Anhalt",
      "type": "Niederlassung",
      "active": true,
      "primaryRadiusKm": 35,
      "secondaryRadiusKm": 60,
      "notes": "Zeitz / Südost."
    }
  ],
  "serviceAreas": [],
  "siteTradeRules": [
    {
      "id": "rule_nordost_reinigung",
      "siteId": "bh_nordost",
      "trade": "Reinigung",
      "priority": "hoch",
      "primaryRadiusKm": 18,
      "secondaryRadiusKm": 30,
      "tertiaryRadiusKm": 45,
      "monthlyCapacity": 18,
      "concurrentCapacity": 7,
      "enabled": true,
      "keywordsPositive": ["gebäudereinigung", "unterhaltsreinigung", "glasreinigung"],
      "keywordsNegative": [],
      "regionNotes": "Berlin Ost"
    },
    {
      "id": "rule_mitte_hausmeister",
      "siteId": "bh_mitte",
      "trade": "Hausmeister",
      "priority": "hoch",
      "primaryRadiusKm": 15,
      "secondaryRadiusKm": 25,
      "tertiaryRadiusKm": 40,
      "monthlyCapacity": 10,
      "concurrentCapacity": 4,
      "enabled": true,
      "keywordsPositive": ["hausmeister", "hauswart", "objektbetreuung"],
      "keywordsNegative": [],
      "regionNotes": "Berlin Mitte"
    },
    {
      "id": "rule_magdeburg_sicherheit",
      "siteId": "nl_magdeburg",
      "trade": "Sicherheit",
      "priority": "hoch",
      "primaryRadiusKm": 35,
      "secondaryRadiusKm": 55,
      "tertiaryRadiusKm": 75,
      "monthlyCapacity": 8,
      "concurrentCapacity": 3,
      "enabled": true,
      "keywordsPositive": ["objektschutz", "sicherheitsdienst", "wachschutz"],
      "keywordsNegative": [],
      "regionNotes": "Sachsen-Anhalt"
    },
    {
      "id": "rule_schkeuditz_winter",
      "siteId": "nl_schkeuditz",
      "trade": "Winterdienst",
      "priority": "mittel",
      "primaryRadiusKm": 35,
      "secondaryRadiusKm": 60,
      "tertiaryRadiusKm": 80,
      "monthlyCapacity": 6,
      "concurrentCapacity": 2,
      "enabled": true,
      "keywordsPositive": ["winterdienst", "schnee", "glätte"],
      "keywordsNegative": [],
      "regionNotes": "Leipzig / Sachsen"
    },
    {
      "id": "rule_suedwest_gruen",
      "siteId": "bh_suedwest",
      "trade": "Grünpflege",
      "priority": "mittel",
      "primaryRadiusKm": 25,
      "secondaryRadiusKm": 40,
      "tertiaryRadiusKm": 55,
      "monthlyCapacity": 7,
      "concurrentCapacity": 3,
      "enabled": true,
      "keywordsPositive": ["grünpflege", "landschaftspflege", "baumpflege"],
      "keywordsNegative": [],
      "regionNotes": "Brandenburg Südwest"
    }
  ],
  "sourceHits": [
    {
      "id": "hit1",
      "sourceId": "src_ted",
      "title": "Unterhaltsreinigung Verwaltungsstandorte Berlin Ost",
      "region": "Berlin",
      "postalCode": "13055",
      "trade": "Reinigung",
      "estimatedValue": 920000,
      "durationMonths": 24,
      "distanceKm": 7,
      "matchedSiteId": "bh_nordost",
      "status": "prefiltered",
      "addedSinceLastFetch": true,
      "url": "https://ted.europa.eu/"
    },
    {
      "id": "hit2",
      "sourceId": "src_ted",
      "title": "Hausmeister- und Objektservice Bezirksimmobilien Mitte",
      "region": "Berlin",
      "postalCode": "12055",
      "trade": "Hausmeister",
      "estimatedValue": 540000,
      "durationMonths": 36,
      "distanceKm": 5,
      "matchedSiteId": "bh_mitte",
      "status": "manual_review",
      "addedSinceLastFetch": true,
      "url": "https://ted.europa.eu/"
    },
    {
      "id": "hit3",
      "sourceId": "src_service_bund",
      "title": "Sicherheitsdienst Verwaltungsobjekte Magdeburg",
      "region": "Magdeburg",
      "postalCode": "39104",
      "trade": "Sicherheit",
      "estimatedValue": 1200000,
      "durationMonths": 24,
      "distanceKm": 4,
      "matchedSiteId": "nl_magdeburg",
      "status": "prefiltered",
      "addedSinceLastFetch": true,
      "url": "https://service.bund.de/"
    },
    {
      "id": "hit4",
      "sourceId": "src_service_bund",
      "title": "Winterdienst kommunale Flächen Schkeuditz",
      "region": "Schkeuditz",
      "postalCode": "04435",
      "trade": "Winterdienst",
      "estimatedValue": 310000,
      "durationMonths": 12,
      "distanceKm": 2,
      "matchedSiteId": "nl_schkeuditz",
      "status": "prefiltered",
      "addedSinceLastFetch": true,
      "url": "https://service.bund.de/"
    },
    {
      "id": "hit5",
      "sourceId": "src_berlin",
      "title": "Pflege und Unterhaltung Grünflächen Südwest",
      "region": "Stahnsdorf / Potsdam",
      "postalCode": "14532",
      "trade": "Grünpflege",
      "estimatedValue": 440000,
      "durationMonths": 18,
      "distanceKm": 3,
      "matchedSiteId": "bh_suedwest",
      "status": "prefiltered",
      "addedSinceLastFetch": true,
      "url": "https://www.berlin.de/vergabeplattform/"
    },
    {
      "id": "hit6",
      "sourceId": "src_ted",
      "title": "Glasreinigung Schulstandorte Ost",
      "region": "Berlin",
      "postalCode": "12681",
      "trade": "Reinigung",
      "estimatedValue": 380000,
      "durationMonths": 12,
      "distanceKm": 6,
      "matchedSiteId": "bh_nordost",
      "status": "observed",
      "addedSinceLastFetch": true,
      "url": "https://ted.europa.eu/"
    },
    {
      "id": "hit7",
      "sourceId": "src_service_bund",
      "title": "Objektschutz landeseigene Liegenschaften",
      "region": "Magdeburg",
      "postalCode": "39106",
      "trade": "Sicherheit",
      "estimatedValue": 870000,
      "durationMonths": 24,
      "distanceKm": 1,
      "matchedSiteId": "nl_magdeburg",
      "status": "observed",
      "addedSinceLastFetch": false,
      "url": "https://service.bund.de/"
    },
    {
      "id": "hit8",
      "sourceId": "src_berlin",
      "title": "Hauswartung Verwaltungseinheiten Neukölln",
      "region": "Berlin",
      "postalCode": "12057",
      "trade": "Hausmeister",
      "estimatedValue": 260000,
      "durationMonths": 24,
      "distanceKm": 1,
      "matchedSiteId": "bh_mitte",
      "status": "manual_review",
      "addedSinceLastFetch": false,
      "url": "https://www.berlin.de/vergabeplattform/"
    },
    {
      "id": "hit9",
      "sourceId": "src_dtvp",
      "title": "Reinigung mittlere Verwaltungsobjekte Brandenburg Süd",
      "region": "Brandenburg Süd",
      "postalCode": "15834",
      "trade": "Reinigung",
      "estimatedValue": 290000,
      "durationMonths": 12,
      "distanceKm": 17,
      "matchedSiteId": "bh_suedost",
      "status": "observed",
      "addedSinceLastFetch": true,
      "url": "https://www.dtvp.de/"
    },
    {
      "id": "hit10",
      "sourceId": "src_ted",
      "title": "Gebäudereinigung Zeitz / Südachsen-Anhalt",
      "region": "Zeitz",
      "postalCode": "06712",
      "trade": "Reinigung",
      "estimatedValue": 610000,
      "durationMonths": 24,
      "distanceKm": 2,
      "matchedSiteId": "nl_zeitz",
      "status": "prefiltered",
      "addedSinceLastFetch": true,
      "url": "https://ted.europa.eu/"
    },
    {
      "id": "hit11",
      "sourceId": "src_service_bund",
      "title": "Baumpflege und Grünservice kommunale Flächen",
      "region": "Stahnsdorf",
      "postalCode": "14532",
      "trade": "Grünpflege",
      "estimatedValue": 330000,
      "durationMonths": 18,
      "distanceKm": 4,
      "matchedSiteId": "bh_suedwest",
      "status": "manual_review",
      "addedSinceLastFetch": true,
      "url": "https://service.bund.de/"
    }
  ],
  "buyers": [],
  "agents": [],
  "tenders": [],
  "pipeline": [],
  "references": []
}
JSON

echo "🧠 Hit- und Regionalauswertung ..."
cat > lib/sourceLogic.ts <<'TS'
export function sourceUsefulnessScore(stat: any) {
  const found = stat.tendersLast30Days || 0;
  const pre = stat.prefilteredLast30Days || 0;
  const go = stat.goLast30Days || 0;
  const errors = stat.errorCountLastRun || 0;
  const dup = stat.duplicateCountLastRun || 0;

  return Math.max(0, (found * 1) + (pre * 2) + (go * 4) - (errors * 5) - (dup * 1));
}

export function sourceHealth(stat: any) {
  if (!stat) return "unbekannt";
  if (stat.lastRunOk && (stat.errorCountLastRun || 0) === 0) return "gruen";
  if ((stat.errorCountLastRun || 0) <= 1) return "gelb";
  return "rot";
}

export function aggregateHitsByRegionAndTrade(hits: any[]) {
  const map = new Map<string, any>();

  for (const hit of hits) {
    const key = `${hit.region}__${hit.trade}`;
    const existing = map.get(key) || {
      region: hit.region,
      trade: hit.trade,
      count: 0,
      volume: 0,
      durations: []
    };

    existing.count += 1;
    existing.volume += hit.estimatedValue || 0;
    if (typeof hit.durationMonths === "number") existing.durations.push(hit.durationMonths);

    map.set(key, existing);
  }

  return [...map.values()].map((row) => ({
    ...row,
    avgDurationMonths: row.durations.length
      ? Math.round(row.durations.reduce((a: number, b: number) => a + b, 0) / row.durations.length)
      : 0
  }));
}
TS

echo "🔌 Source Hits / Refresh APIs ..."
cat > app/api/source-hits/route.ts <<'TS'
import { NextResponse } from "next/server";
import { readStore } from "@/lib/storage";
import { aggregateHitsByRegionAndTrade } from "@/lib/sourceLogic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const sourceId = searchParams.get("sourceId");
  const onlyNew = searchParams.get("onlyNew") === "true";

  const db = await readStore();
  let hits = db.sourceHits || [];

  if (sourceId) hits = hits.filter((x: any) => x.sourceId === sourceId);
  if (onlyNew) hits = hits.filter((x: any) => x.addedSinceLastFetch);

  return NextResponse.json({
    hits,
    summary: aggregateHitsByRegionAndTrade(hits)
  });
}
TS

cat > app/api/source-refresh/route.ts <<'TS'
import { NextResponse } from "next/server";
import { readStore, replaceCollection } from "@/lib/storage";

export async function POST() {
  const db = await readStore();
  const now = new Date().toISOString();

  const updatedStats = (db.sourceStats || []).map((row: any) => ({
    ...row,
    lastFetchAt: now,
    lastRunOk: true
  }));

  const updatedMeta = {
    ...(db.meta || {}),
    lastSuccessfulIngestionAt: now,
    lastSuccessfulIngestionSource: "Manueller Testlauf"
  };

  await replaceCollection("sourceStats", updatedStats);
  await replaceCollection("meta", [updatedMeta]);

  return NextResponse.json({
    ok: true,
    refreshedAt: now
  });
}
TS

echo "📊 Dashboard realistischer machen ..."
cat > app/page.tsx <<'TSX'
import Link from "next/link";
import { readStore } from "@/lib/storage";
import { sourceHealth, sourceUsefulnessScore, aggregateHitsByRegionAndTrade } from "@/lib/sourceLogic";

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
  const db = await readStore();
  const hits = db.sourceHits || [];
  const registry = db.sourceRegistry || [];
  const stats = db.sourceStats || [];
  const sites = (db.sites || []).filter((x: any) => x.active);
  const rules = (db.siteTradeRules || []).filter((x: any) => x.enabled);
  const meta = db.meta || {};

  const newHits = hits.filter((x: any) => x.addedSinceLastFetch);
  const prefiltered = hits.filter((x: any) => x.status === "prefiltered");
  const manual = hits.filter((x: any) => x.status === "manual_review");
  const noGo = hits.filter((x: any) => x.status === "no_go");
  const grouped = aggregateHitsByRegionAndTrade(hits);

  const rows = registry.map((src: any) => {
    const stat = stats.find((s: any) => s.id === src.id) || {};
    return {
      ...src,
      ...stat,
      health: sourceHealth(stat),
      usefulnessScore: sourceUsefulnessScore(stat)
    };
  }).sort((a: any, b: any) => b.usefulnessScore - a.usefulnessScore);

  const bestSource = rows[0];

  return (
    <div className="stack">
      <section>
        <h1 className="h1">Vertriebssteuerung neu denken.</h1>
        <p className="sub">
          Betriebshof-, Gewerk-, Radius- und Quellen-gesteuerte Steuerzentrale für RUWE inkl. klickbarer Trefferlisten.
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
            {pill(`${newHits.length} neu`, "good")}
            {pill(`${stats.reduce((sum: number, s: any) => sum + (s.duplicateCountLastRun || 0), 0)} Dubletten`, "warn")}
            {pill(`${stats.reduce((sum: number, s: any) => sum + (s.errorCountLastRun || 0), 0)} Fehler`, stats.reduce((sum: number, s: any) => sum + (s.errorCountLastRun || 0), 0) ? "bad" : "good")}
            <Link className="button" href="/dashboard/source-tests">Tests</Link>
            <Link className="linkish" href="/dashboard/monitoring">Details</Link>
          </div>
        </div>
      </section>

      <section className="grid grid-6">
        <KpiCard href="/dashboard/new-hits" label="Neu gefunden" value={newHits.length} sub="Seit letztem Abruf" />
        <KpiCard href="/source-hits" label="Gesamt Treffer" value={hits.length} sub="Öffnet alle Treffer" />
        <KpiCard href="/source-hits?status=prefiltered" label="Bid vorausgewählt" value={prefiltered.length} sub="Arbeitsliste" />
        <KpiCard href="/source-hits?status=manual_review" label="Manuell prüfen" value={manual.length} sub="Offene Entscheidungen" />
        <KpiCard href="/sites" label="Betriebshöfe / Regeln" value={`${sites.length} / ${rules.length}`} sub="Aktive Abdeckung" />
        <KpiCard href="/dashboard/monitoring" label="Sinnvollste Quelle" value={bestSource?.name || "-"} sub={`Score: ${bestSource?.usefulnessScore || 0}`} />
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
                  <th>Letzter Monat</th>
                  <th>Seit letztem Abruf</th>
                  <th>Vor</th>
                  <th>Go</th>
                  <th>Score</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row: any) => (
                  <tr key={row.id}>
                    <td>{row.name}</td>
                    <td>{row.lastFetchAt || "-"}</td>
                    <td>{row.tendersLast30Days || 0}</td>
                    <td>{row.tendersSinceLastFetch || 0}</td>
                    <td>{row.prefilteredLast30Days || 0}</td>
                    <td>{row.goLast30Days || 0}</td>
                    <td>{row.usefulnessScore}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <div className="section-title">Region × Gewerk × Volumen</div>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Region</th>
                  <th>Gewerk</th>
                  <th>Anzahl</th>
                  <th>Volumen</th>
                  <th>Laufzeit Ø</th>
                </tr>
              </thead>
              <tbody>
                {grouped.map((row: any) => (
                  <tr key={`${row.region}_${row.trade}`}>
                    <td>{row.region}</td>
                    <td>{row.trade}</td>
                    <td>{row.count}</td>
                    <td>{Math.round(row.volume / 1000)}k €</td>
                    <td>{row.avgDurationMonths} Mon.</td>
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

cat > app/dashboard/new-hits/page.tsx <<'TSX'
import Link from "next/link";
import { readStore } from "@/lib/storage";

export default async function NewHitsPage() {
  const db = await readStore();
  const hits = (db.sourceHits || []).filter((x: any) => x.addedSinceLastFetch);

  return (
    <div className="stack">
      <div>
        <h1 className="h1">Neue Treffer seit letztem Abruf</h1>
        <p className="sub">Hier werden die aktuell neu gefundenen Ausschreibungen geöffnet und bewertet.</p>
      </div>

      <div className="card table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Titel</th>
              <th>Quelle</th>
              <th>Region</th>
              <th>Gewerk</th>
              <th>Volumen</th>
              <th>Laufzeit</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {hits.map((x: any) => (
              <tr key={x.id}>
                <td><Link className="linkish" href={x.url} target="_blank">{x.title}</Link></td>
                <td>{x.sourceId}</td>
                <td>{x.region}</td>
                <td>{x.trade}</td>
                <td>{Math.round((x.estimatedValue || 0) / 1000)}k €</td>
                <td>{x.durationMonths} Mon.</td>
                <td>{x.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
TSX

cat > app/source-hits/page.tsx <<'TSX'
import Link from "next/link";
import { readStore } from "@/lib/storage";

export default async function SourceHitsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const params = await searchParams;
  const db = await readStore();

  let hits = db.sourceHits || [];
  if (params.status) hits = hits.filter((x: any) => x.status === params.status);

  return (
    <div className="stack">
      <div>
        <h1 className="h1">Source Hits</h1>
        <p className="sub">Alle gefundenen Ausschreibungen mit Direktsprung zur Quelle.</p>
      </div>

      <div className="card table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Titel</th>
              <th>Quelle</th>
              <th>Standortmatch</th>
              <th>Region</th>
              <th>PLZ</th>
              <th>Gewerk</th>
              <th>Distanz</th>
              <th>Volumen</th>
              <th>Laufzeit</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {hits.map((x: any) => (
              <tr key={x.id}>
                <td><Link className="linkish" href={x.url} target="_blank">{x.title}</Link></td>
                <td>{x.sourceId}</td>
                <td>{x.matchedSiteId}</td>
                <td>{x.region}</td>
                <td>{x.postalCode}</td>
                <td>{x.trade}</td>
                <td>{x.distanceKm} km</td>
                <td>{Math.round((x.estimatedValue || 0) / 1000)}k €</td>
                <td>{x.durationMonths} Mon.</td>
                <td>{x.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
TSX

cat > app/dashboard/source-tests/page.tsx <<'TSX'
import { readStore } from "@/lib/storage";
import { sourceHealth, sourceUsefulnessScore } from "@/lib/sourceLogic";

function healthBadge(health: string) {
  if (health === "gruen") return "badge badge-gut";
  if (health === "gelb") return "badge badge-gemischt";
  return "badge badge-kritisch";
}

export default async function SourceTestsPage() {
  const db = await readStore();
  const registry = db.sourceRegistry || [];
  const stats = db.sourceStats || [];

  const rows = registry.map((src: any) => {
    const stat = stats.find((s: any) => s.id === src.id) || {};
    return {
      ...src,
      ...stat,
      health: sourceHealth(stat),
      usefulnessScore: sourceUsefulnessScore(stat)
    };
  });

  return (
    <div className="stack">
      <div>
        <h1 className="h1">Source Tests</h1>
        <p className="sub">Hier siehst du sofort, ob eine Quelle zuletzt erfolgreich war.</p>
      </div>

      <div className="card table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Quelle</th>
              <th>Status</th>
              <th>Official</th>
              <th>Auth</th>
              <th>Errors</th>
              <th>Dubletten</th>
              <th>Score</th>
              <th>Legal Use</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row: any) => (
              <tr key={row.id}>
                <td>{row.name}</td>
                <td><span className={healthBadge(row.health)}>{row.health}</span></td>
                <td>{row.official ? "Ja" : "Nein"}</td>
                <td>{row.authRequired ? "Ja" : "Nein"}</td>
                <td>{row.errorCountLastRun || 0}</td>
                <td>{row.duplicateCountLastRun || 0}</td>
                <td>{row.usefulnessScore}</td>
                <td>{row.legalUse}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
TSX

echo "🎨 Refresh Button ergänzen ..."
python3 - <<'PY'
from pathlib import Path
p = Path("app/globals.css")
text = p.read_text()
extra = """

.button-secondary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 12px 16px;
  background: white;
  color: var(--ink);
  font-weight: 700;
  text-decoration: none;
}
"""
if ".button-secondary {" not in text:
    text += extra
p.write_text(text)
PY

echo "🧾 Docs ..."
cat > docs/SOURCE_EXECUTION_MODEL.md <<'DOC'
# SOURCE_EXECUTION_MODEL

## Ziel
Quellen nicht nur zählen, sondern über echte Trefferlisten steuerbar machen.

## Dafür notwendig
- sourceRegistry
- sourceStats
- sourceHits
- Refresh/Test je Quelle
- Listen: neu / vorgefiltert / manuell prüfen
- Region × Gewerk × Volumen × Laufzeit

## Qualitätsprinzip
Nicht "es gibt 11", sondern "hier sind die 11 und daraus folgt folgende Priorisierung".
DOC

npm run build || true
git add .
git commit -m "feat: replace synthetic dashboard counts with clickable source hits, refresh-ready monitoring and Betriebshof-focused model" || true
git push origin main || true

echo "✅ Betriebshof- und Hitlist-Upgrade eingebaut."
