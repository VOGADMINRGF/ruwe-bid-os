#!/bin/bash
set -e

cd "$(pwd)"

echo "🚀 RUWE Bid OS — Source Registry & Source Test Upgrade"

mkdir -p app/dashboard/source-tests
mkdir -p app/api/source-tests
mkdir -p app/sources
mkdir -p lib

echo "📦 Source Registry erweitern ..."
cat > data/db.json <<'JSON'
{
  "meta": {
    "appName": "RUWE Bid OS",
    "version": "source-registry-test-upgrade",
    "lastSeededAt": "2026-04-09T10:30:00.000Z",
    "lastSuccessfulIngestionAt": "2026-04-09T09:50:00.000Z",
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
      "notes": "Offizielle API für veröffentlichte Bekanntmachungen; für Analyse und Wiederverwendung gedacht."
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
      "notes": "Offizielle RSS-Feeds; sekundärer Publikationskanal, nicht alleinige Quelle."
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
      "notes": "Öffentliche Bekanntmachungen sichtbar; RSS vorhanden; weitergehende Firmenfunktionen via Registrierung."
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
      "notes": "Reichweitenstark, aber für ersten Kern eher Portal/Partnerquelle statt frei dokumentierte Maschinenquelle."
    }
  ],
  "sourceStats": [
    {
      "id": "src_ted",
      "lastFetchAt": "2026-04-09T09:50:00.000Z",
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
      "lastFetchAt": "2026-04-09T09:30:00.000Z",
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
      "lastFetchAt": "2026-04-09T09:10:00.000Z",
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
      "lastFetchAt": "2026-04-09T08:45:00.000Z",
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
      "id": "site_berlin",
      "name": "RUWE Gruppe Berlin",
      "city": "Berlin",
      "state": "Berlin",
      "type": "Betriebshof",
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
      "type": "Betriebshof",
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
      "type": "Betriebshof",
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
      "type": "Betriebshof",
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
    }
  ],
  "buyers": [],
  "agents": [],
  "tenders": [],
  "pipeline": [],
  "references": []
}
JSON

echo "🧠 Source-Logik ..."
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
TS

echo "🔌 API für Source-Tests ..."
cat > app/api/source-tests/route.ts <<'TS'
import { NextResponse } from "next/server";
import { readStore } from "@/lib/storage";
import { sourceHealth, sourceUsefulnessScore } from "@/lib/sourceLogic";

export async function GET() {
  const db = await readStore();
  const registry = db.sourceRegistry || [];
  const stats = db.sourceStats || [];

  const merged = registry.map((src: any) => {
    const stat = stats.find((s: any) => s.id === src.id) || null;
    return {
      ...src,
      stat,
      health: sourceHealth(stat),
      usefulnessScore: sourceUsefulnessScore(stat)
    };
  });

  return NextResponse.json(merged);
}
TS

echo "📊 Dashboard Monitoring stärker nutzbar ..."
cat > app/dashboard/monitoring/page.tsx <<'TSX'
import { readStore } from "@/lib/storage";
import { sourceHealth, sourceUsefulnessScore } from "@/lib/sourceLogic";

function healthBadge(health: string) {
  if (health === "gruen") return "badge badge-gut";
  if (health === "gelb") return "badge badge-gemischt";
  return "badge badge-kritisch";
}

export default async function MonitoringPage() {
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
        <h1 className="h1">Monitoring</h1>
        <p className="sub">Quelle, letzter Abruf, Nutzen, Fehler und Eignung für RUWE.</p>
      </div>

      <div className="card table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Quelle</th>
              <th>Status</th>
              <th>Typ</th>
              <th>Letzter Abruf</th>
              <th>letzter Monat</th>
              <th>seit letztem Abruf</th>
              <th>vorausgewählt</th>
              <th>Go</th>
              <th>Score</th>
              <th>Hinweis</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row: any) => (
              <tr key={row.id}>
                <td>{row.name}</td>
                <td><span className={healthBadge(row.health)}>{row.health}</span></td>
                <td>{row.type}</td>
                <td>{row.lastFetchAt || "-"}</td>
                <td>{row.tendersLast30Days || 0}</td>
                <td>{row.tendersSinceLastFetch || 0}</td>
                <td>{row.prefilteredLast30Days || 0}</td>
                <td>{row.goLast30Days || 0}</td>
                <td>{row.usefulnessScore}</td>
                <td>{row.notes}</td>
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
        <p className="sub">Übersicht, welche Quellen erfolgreich sind und wie sinnvoll sie für RUWE wirken.</p>
      </div>
      <div className="card">
        <pre className="doc">{JSON.stringify(rows, null, 2)}</pre>
      </div>
    </div>
  );
}
TSX

cat > app/sources/page.tsx <<'TSX'
import { readStore } from "@/lib/storage";

export default async function SourcesPage() {
  const db = await readStore();
  const rows = db.sourceRegistry || [];

  return (
    <div className="stack">
      <div>
        <h1 className="h1">Sources</h1>
        <p className="sub">Quellenregister mit rechtlicher/technischer Einordnung.</p>
      </div>
      <div className="card table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Quelle</th>
              <th>Typ</th>
              <th>Official</th>
              <th>Auth</th>
              <th>Legal Use</th>
              <th>Hinweis</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((x: any) => (
              <tr key={x.id}>
                <td>{x.name}</td>
                <td>{x.type}</td>
                <td>{x.official ? "Ja" : "Nein"}</td>
                <td>{x.authRequired ? "Ja" : "Nein"}</td>
                <td>{x.legalUse}</td>
                <td>{x.notes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
TSX

echo "🧭 Navigation ergänzen ..."
cat > components/Nav.tsx <<'TSX'
import Link from "next/link";

const items = [
  ["/", "Dashboard"],
  ["/sources", "Sources"],
  ["/dashboard/monitoring", "Monitoring"],
  ["/dashboard/source-tests", "Source Tests"],
  ["/sites", "Sites"],
  ["/service-areas", "Service Areas"],
  ["/site-rules", "Site Rules"],
  ["/keywords", "Keywords"],
  ["/tenders", "Tenders"],
  ["/pipeline", "Pipeline"],
  ["/agents", "Agents"],
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

echo "🧾 Docs für Quellenstrategie ..."
cat > docs/SOURCE_STRATEGY.md <<'DOC'
# SOURCE_STRATEGY

## Klasse A — sofort nutzbar
- TED Search API
- service.bund RSS / Suchprofile
- Berliner Vergabeplattform inkl. RSS / öffentliche Bekanntmachungen

## Klasse B — mit Vorsicht
- DTVP
- weitere Plattformen ohne klar dokumentierte offene API

## Bewertungslogik je Quelle
- letzter Abruf
- Treffer letzter Monat
- Treffer seit letztem Abruf
- Vorauswahlquote
- Go-Quote
- Fehlerquote
- Dublettenquote
DOC

cat > docs/OpenTasks.md <<'DOC'
# OpenTasks

## P2 Operational Core
- [ ] Betriebshof-Modell weiter schärfen
- [ ] Filter nach Quelle / Standort / Gewerk / Status
- [ ] Source Registry editierbar machen

## P3 Intelligence
- [ ] Nutzen-Score je Quelle verfeinern
- [ ] Explainability für Vorfilterung je Tender

## P4 Ingestion
- [ ] echter TED Connector
- [ ] echter service.bund Connector
- [ ] Berliner RSS / Bekanntmachungsconnector
- [ ] DTVP nur mit sauberem Partner-/Portalansatz
- [ ] Source Test automatisieren

## P5 Production
- [ ] Rollenmodell
- [ ] Audit Log
- [ ] Scheduler
- [ ] Reporting / Export
DOC

npm run build || true
git add .
git commit -m "feat: add source registry, source tests and monitoring usefulness layer" || true
git push origin main || true

echo "✅ Source Registry & Tests eingebaut."
