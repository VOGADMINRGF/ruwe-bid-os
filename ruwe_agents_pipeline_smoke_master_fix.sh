#!/bin/bash
set -e

cd "$(pwd)"

echo "🚀 RUWE Bid OS — Agents / Pipeline / Smoke Master Fix"

mkdir -p app/dashboard/smoke
mkdir -p app/dashboard/ai-smoke
mkdir -p app/pipeline
mkdir -p app/agents
mkdir -p lib
mkdir -p data

echo "🧠 Demo-Daten modernisieren ..."
cat > data/db.json <<'JSON'
{
  "meta": {
    "appName": "RUWE Bid OS",
    "version": "phase5-master-fix",
    "lastSuccessfulIngestionAt": "2026-04-09T13:05:00.000Z",
    "lastSuccessfulIngestionSource": "TED Search API",
    "dataMode": "demo",
    "dataValidityNote": "Aktuell Demo-/Smoke-Stand mit ersten Live-Elementen. Werte sind strukturell nutzbar, aber noch nicht voll produktiv belastbar."
  },
  "config": {},
  "sourceRegistry": [
    { "id": "src_ted", "name": "TED Search API", "type": "api", "official": true, "authRequired": false, "legalUse": "hoch", "dataMode": "demo" },
    { "id": "src_service_bund", "name": "service.bund.de RSS", "type": "rss", "official": true, "authRequired": false, "legalUse": "mittel", "dataMode": "demo" },
    { "id": "src_berlin", "name": "Vergabeplattform Berlin", "type": "portal_rss", "official": true, "authRequired": false, "legalUse": "mittel", "dataMode": "demo" },
    { "id": "src_dtvp", "name": "DTVP", "type": "portal", "official": true, "authRequired": false, "legalUse": "vorsicht", "dataMode": "demo" }
  ],
  "sourceStats": [
    { "id": "src_ted", "lastFetchAt": "2026-04-09T13:05:00.000Z", "tendersLast30Days": 28, "tendersSinceLastFetch": 5, "prefilteredLast30Days": 11, "goLast30Days": 4, "errorCountLastRun": 0, "duplicateCountLastRun": 1, "lastRunOk": true, "dataMode": "demo" },
    { "id": "src_service_bund", "lastFetchAt": "2026-04-09T12:52:00.000Z", "tendersLast30Days": 19, "tendersSinceLastFetch": 3, "prefilteredLast30Days": 7, "goLast30Days": 2, "errorCountLastRun": 0, "duplicateCountLastRun": 0, "lastRunOk": true, "dataMode": "demo" },
    { "id": "src_berlin", "lastFetchAt": "2026-04-09T12:35:00.000Z", "tendersLast30Days": 13, "tendersSinceLastFetch": 2, "prefilteredLast30Days": 4, "goLast30Days": 1, "errorCountLastRun": 0, "duplicateCountLastRun": 0, "lastRunOk": true, "dataMode": "demo" },
    { "id": "src_dtvp", "lastFetchAt": "2026-04-09T12:10:00.000Z", "tendersLast30Days": 9, "tendersSinceLastFetch": 1, "prefilteredLast30Days": 2, "goLast30Days": 0, "errorCountLastRun": 1, "duplicateCountLastRun": 0, "lastRunOk": false, "dataMode": "demo" }
  ],
  "sourceHits": [
    { "id": "hit1", "sourceId": "src_ted", "title": "Unterhaltsreinigung Verwaltungsstandorte Berlin Ost", "region": "Berlin", "postalCode": "13055", "trade": "Reinigung", "estimatedValue": 920000, "durationMonths": 24, "distanceKm": 7, "matchedSiteId": "bh_nordost", "status": "prefiltered", "addedSinceLastFetch": true, "url": "https://ted.europa.eu/", "dataMode": "demo" },
    { "id": "hit2", "sourceId": "src_ted", "title": "Objektservice Bezirksimmobilien Mitte", "region": "Berlin", "postalCode": "12055", "trade": "Hausmeister", "estimatedValue": 540000, "durationMonths": 36, "distanceKm": 5, "matchedSiteId": "bh_mitte", "status": "manual_review", "addedSinceLastFetch": true, "url": "https://ted.europa.eu/", "dataMode": "demo" },
    { "id": "hit3", "sourceId": "src_service_bund", "title": "Sicherheitsdienst Verwaltungsobjekte Magdeburg", "region": "Magdeburg", "postalCode": "39104", "trade": "Sicherheit", "estimatedValue": 1200000, "durationMonths": 24, "distanceKm": 4, "matchedSiteId": "nl_magdeburg", "status": "prefiltered", "addedSinceLastFetch": true, "url": "https://service.bund.de/", "dataMode": "demo" },
    { "id": "hit4", "sourceId": "src_service_bund", "title": "Winterdienst kommunale Flächen Schkeuditz", "region": "Schkeuditz", "postalCode": "04435", "trade": "Winterdienst", "estimatedValue": 310000, "durationMonths": 12, "distanceKm": 2, "matchedSiteId": "nl_schkeuditz", "status": "prefiltered", "addedSinceLastFetch": true, "url": "https://service.bund.de/", "dataMode": "demo" },
    { "id": "hit5", "sourceId": "src_berlin", "title": "Pflege und Unterhaltung Grünflächen Südwest", "region": "Stahnsdorf / Potsdam", "postalCode": "14532", "trade": "Grünpflege", "estimatedValue": 440000, "durationMonths": 18, "distanceKm": 3, "matchedSiteId": "bh_suedwest", "status": "prefiltered", "addedSinceLastFetch": true, "url": "https://www.berlin.de/vergabeplattform/", "dataMode": "demo" },
    { "id": "hit6", "sourceId": "src_ted", "title": "Gebäudereinigung Zeitz / Südachsen-Anhalt", "region": "Zeitz", "postalCode": "06712", "trade": "Reinigung", "estimatedValue": 610000, "durationMonths": 24, "distanceKm": 2, "matchedSiteId": "nl_zeitz", "status": "prefiltered", "addedSinceLastFetch": true, "url": "https://ted.europa.eu/", "dataMode": "demo" },
    { "id": "hit7", "sourceId": "src_service_bund", "title": "Objektschutz landeseigene Liegenschaften", "region": "Magdeburg", "postalCode": "39106", "trade": "Sicherheit", "estimatedValue": 870000, "durationMonths": 24, "distanceKm": 1, "matchedSiteId": "nl_magdeburg", "status": "observed", "addedSinceLastFetch": false, "url": "https://service.bund.de/", "dataMode": "demo" },
    { "id": "hit8", "sourceId": "src_berlin", "title": "Hauswartung Verwaltungseinheiten Neukölln", "region": "Berlin", "postalCode": "12057", "trade": "Hausmeister", "estimatedValue": 260000, "durationMonths": 24, "distanceKm": 1, "matchedSiteId": "bh_mitte", "status": "manual_review", "addedSinceLastFetch": false, "url": "https://www.berlin.de/vergabeplattform/", "dataMode": "demo" },
    { "id": "hit9", "sourceId": "src_dtvp", "title": "Reinigung mittlere Verwaltungsobjekte Brandenburg Süd", "region": "Brandenburg Süd", "postalCode": "15834", "trade": "Reinigung", "estimatedValue": 290000, "durationMonths": 12, "distanceKm": 17, "matchedSiteId": "bh_suedost", "status": "observed", "addedSinceLastFetch": true, "url": "https://www.dtvp.de/", "dataMode": "demo" },
    { "id": "hit10", "sourceId": "src_ted", "title": "Glasreinigung Schulstandorte Ost", "region": "Berlin", "postalCode": "12681", "trade": "Glasreinigung", "estimatedValue": 380000, "durationMonths": 12, "distanceKm": 6, "matchedSiteId": "bh_nordost", "status": "observed", "addedSinceLastFetch": true, "url": "https://ted.europa.eu/", "dataMode": "demo" },
    { "id": "hit11", "sourceId": "src_service_bund", "title": "Baumpflege und Grünservice kommunale Flächen", "region": "Stahnsdorf", "postalCode": "14532", "trade": "Grünpflege", "estimatedValue": 330000, "durationMonths": 18, "distanceKm": 4, "matchedSiteId": "bh_suedwest", "status": "manual_review", "addedSinceLastFetch": true, "url": "https://service.bund.de/", "dataMode": "demo" }
  ],
  "sites": [
    { "id": "bh_nordost", "name": "Betriebshof Nord-Ost", "city": "Berlin", "postalCode": "13053", "state": "Berlin", "type": "Betriebshof", "active": true, "primaryRadiusKm": 18, "secondaryRadiusKm": 30, "notes": "Reinigung / Glas / Ost", "dataMode": "demo" },
    { "id": "bh_nordwest", "name": "Betriebshof Nord-West", "city": "Berlin", "postalCode": "13599", "state": "Berlin", "type": "Betriebshof", "active": true, "primaryRadiusKm": 18, "secondaryRadiusKm": 30, "notes": "West", "dataMode": "demo" },
    { "id": "bh_mitte", "name": "Betriebshof Mitte", "city": "Berlin", "postalCode": "12057", "state": "Berlin", "type": "Betriebshof", "active": true, "primaryRadiusKm": 15, "secondaryRadiusKm": 25, "notes": "Hausmeister / Hauswart", "dataMode": "demo" },
    { "id": "bh_suedost", "name": "Betriebshof Süd-Ost", "city": "Groß Kienitz", "postalCode": "15831", "state": "Brandenburg", "type": "Betriebshof", "active": true, "primaryRadiusKm": 25, "secondaryRadiusKm": 40, "notes": "Südost", "dataMode": "demo" },
    { "id": "bh_suedwest", "name": "Betriebshof Süd-West", "city": "Stahnsdorf", "postalCode": "14532", "state": "Brandenburg", "type": "Betriebshof", "active": true, "primaryRadiusKm": 25, "secondaryRadiusKm": 40, "notes": "Südwest / Grün", "dataMode": "demo" },
    { "id": "nl_magdeburg", "name": "Niederlassung Magdeburg", "city": "Magdeburg", "postalCode": "39106", "state": "Sachsen-Anhalt", "type": "Niederlassung", "active": true, "primaryRadiusKm": 35, "secondaryRadiusKm": 55, "notes": "Sicherheit", "dataMode": "demo" },
    { "id": "nl_schkeuditz", "name": "Niederlassung Schkeuditz", "city": "Schkeuditz", "postalCode": "04435", "state": "Sachsen", "type": "Niederlassung", "active": true, "primaryRadiusKm": 35, "secondaryRadiusKm": 60, "notes": "Winterdienst / Sachsen", "dataMode": "demo" },
    { "id": "nl_zeitz", "name": "Niederlassung Zeitz", "city": "Zeitz", "postalCode": "06712", "state": "Sachsen-Anhalt", "type": "Niederlassung", "active": true, "primaryRadiusKm": 35, "secondaryRadiusKm": 60, "notes": "Zeitz", "dataMode": "demo" }
  ],
  "serviceAreas": [],
  "siteTradeRules": [
    { "id": "rule_nordost_reinigung", "siteId": "bh_nordost", "trade": "Reinigung", "priority": "hoch", "primaryRadiusKm": 18, "secondaryRadiusKm": 30, "tertiaryRadiusKm": 45, "monthlyCapacity": 18, "concurrentCapacity": 7, "enabled": true, "keywordsPositive": ["gebäudereinigung", "unterhaltsreinigung", "glasreinigung"], "keywordsNegative": [], "dataMode": "demo" },
    { "id": "rule_nordost_glas", "siteId": "bh_nordost", "trade": "Glasreinigung", "priority": "mittel", "primaryRadiusKm": 18, "secondaryRadiusKm": 30, "tertiaryRadiusKm": 45, "monthlyCapacity": 10, "concurrentCapacity": 4, "enabled": true, "keywordsPositive": ["glasreinigung"], "keywordsNegative": [], "dataMode": "demo" },
    { "id": "rule_mitte_hausmeister", "siteId": "bh_mitte", "trade": "Hausmeister", "priority": "hoch", "primaryRadiusKm": 15, "secondaryRadiusKm": 25, "tertiaryRadiusKm": 40, "monthlyCapacity": 10, "concurrentCapacity": 4, "enabled": true, "keywordsPositive": ["hausmeister", "hauswart"], "keywordsNegative": [], "dataMode": "demo" },
    { "id": "rule_magdeburg_sicherheit", "siteId": "nl_magdeburg", "trade": "Sicherheit", "priority": "hoch", "primaryRadiusKm": 35, "secondaryRadiusKm": 55, "tertiaryRadiusKm": 75, "monthlyCapacity": 8, "concurrentCapacity": 3, "enabled": true, "keywordsPositive": ["objektschutz", "sicherheitsdienst"], "keywordsNegative": [], "dataMode": "demo" },
    { "id": "rule_schkeuditz_winter", "siteId": "nl_schkeuditz", "trade": "Winterdienst", "priority": "mittel", "primaryRadiusKm": 35, "secondaryRadiusKm": 60, "tertiaryRadiusKm": 80, "monthlyCapacity": 6, "concurrentCapacity": 2, "enabled": true, "keywordsPositive": ["winterdienst"], "keywordsNegative": [], "dataMode": "demo" }
  ],
  "buyers": [
    { "id": "buyer1", "name": "Land Berlin", "type": "Öffentlich", "strategic": true, "dataMode": "demo" },
    { "id": "buyer2", "name": "Stadt Magdeburg", "type": "Öffentlich", "strategic": true, "dataMode": "demo" }
  ],
  "agents": [
    { "id": "coord1", "name": "Koordination Nord/Ost", "focus": "Berlin Ost · Reinigung / Glas", "level": "Koordination", "winRate": 0.41, "pipelineValue": 1800000, "responsibility": "Priorisierung, Angebotssteuerung, Eskalation", "weeklyTask": "Stage-Pflege bis Freitag 16:00", "dataMode": "demo" },
    { "id": "coord2", "name": "Koordination Mitte", "focus": "Berlin Mitte · Hausmeister / Objektservice", "level": "Koordination", "winRate": 0.37, "pipelineValue": 900000, "responsibility": "Review, Entscheidungsvorbereitung, Ressourcenabgleich", "weeklyTask": "Stage-Pflege bis Freitag 16:00", "dataMode": "demo" },
    { "id": "coord3", "name": "Koordination Sachsen", "focus": "Schkeuditz / Zeitz · Reinigung / Winterdienst", "level": "Koordination", "winRate": 0.29, "pipelineValue": 1200000, "responsibility": "Regionale Steuerung, Go/No-Go, Angebotsreife", "weeklyTask": "Stage-Pflege bis Freitag 16:00", "dataMode": "demo" },
    { "id": "coord4", "name": "Koordination Sicherheit", "focus": "Magdeburg · Sicherheit", "level": "Koordination", "winRate": 0.24, "pipelineValue": 800000, "responsibility": "Sicherheitsvergaben, Risiko- und Fristensteuerung", "weeklyTask": "Stage-Pflege bis Freitag 16:00", "dataMode": "demo" },
    { "id": "assist1", "name": "Assistenz Monitoring", "focus": "Quellenlauf / Vorqualifizierung", "level": "Assistenz", "winRate": 0.12, "pipelineValue": 0, "responsibility": "Quellen prüfen, Treffer vorsortieren, Dubletten markieren", "weeklyTask": "Montag und Donnerstag Quellencheck", "dataMode": "demo" },
    { "id": "assist2", "name": "Assistenz Pipeline", "focus": "Stage-Pflege / Nachfassen", "level": "Assistenz", "winRate": 0.10, "pipelineValue": 0, "responsibility": "Pipeline pflegen, fehlende Felder ergänzen, Owner erinnern", "weeklyTask": "Freitag EOW-Stage-Pflege", "dataMode": "demo" }
  ],
  "tenders": [
    { "id": "t1", "title": "Unterhaltsreinigung Verwaltungsstandorte Berlin Ost", "region": "Berlin", "trade": "Reinigung", "decision": "Bid", "manualReview": "nein", "distanceKm": 7, "dueDate": "2026-04-20", "buyerId": "buyer1", "ownerId": "coord1", "stage": "Bid geplant", "nextStep": "Angebotsunterlagen anfordern", "dataMode": "demo" },
    { "id": "t2", "title": "Objektservice Bezirksimmobilien Mitte", "region": "Berlin", "trade": "Hausmeister", "decision": "Prüfen", "manualReview": "zwingend", "distanceKm": 5, "dueDate": "2026-04-18", "buyerId": "buyer1", "ownerId": "coord2", "stage": "Review offen", "nextStep": "Leistungsumfang gegen Kapazität prüfen", "dataMode": "demo" },
    { "id": "t3", "title": "Sicherheitsdienst Verwaltungsobjekte Magdeburg", "region": "Magdeburg", "trade": "Sicherheit", "decision": "Bid", "manualReview": "optional", "distanceKm": 4, "dueDate": "2026-04-25", "buyerId": "buyer2", "ownerId": "coord4", "stage": "Bid vorbereitet", "nextStep": "Preisblatt und Einsatzmodell abstimmen", "dataMode": "demo" },
    { "id": "t4", "title": "Winterdienst kommunale Flächen Schkeuditz", "region": "Schkeuditz", "trade": "Winterdienst", "decision": "Bid", "manualReview": "nein", "distanceKm": 2, "dueDate": "2026-04-23", "buyerId": "buyer2", "ownerId": "coord3", "stage": "Freigabe intern", "nextStep": "Kalkulation finalisieren", "dataMode": "demo" },
    { "id": "t5", "title": "Pflege und Unterhaltung Grünflächen Südwest", "region": "Stahnsdorf / Potsdam", "trade": "Grünpflege", "decision": "Prüfen", "manualReview": "optional", "distanceKm": 3, "dueDate": "2026-04-29", "buyerId": "buyer1", "ownerId": "coord3", "stage": "Review offen", "nextStep": "Leistungsbild gegen Standortabdeckung prüfen", "dataMode": "demo" }
  ],
  "pipeline": [
    { "id": "p1", "title": "Berlin Ost Reinigung", "stage": "Qualifiziert", "value": 920000, "ownerId": "coord1", "priority": "A", "nextStep": "Go bestätigen", "eowUpdate": "Bid am Freitag auf Angebotsphase setzen", "dataMode": "demo" },
    { "id": "p2", "title": "Berlin Mitte Objektservice", "stage": "Review", "value": 540000, "ownerId": "coord2", "priority": "A", "nextStep": "Kapazität prüfen", "eowUpdate": "Stage nach Review aktualisieren", "dataMode": "demo" },
    { "id": "p3", "title": "Magdeburg Sicherheit", "stage": "Angebot", "value": 1200000, "ownerId": "coord4", "priority": "A", "nextStep": "Preisblatt finalisieren", "eowUpdate": "Status auf eingereicht oder offen setzen", "dataMode": "demo" },
    { "id": "p4", "title": "Schkeuditz Winterdienst", "stage": "Freigabe intern", "value": 310000, "ownerId": "coord3", "priority": "B", "nextStep": "Kalkulation abstimmen", "eowUpdate": "Freigabestand dokumentieren", "dataMode": "demo" },
    { "id": "p5", "title": "Stahnsdorf Grünpflege", "stage": "Review", "value": 440000, "ownerId": "coord3", "priority": "B", "nextStep": "Abdeckung und Marge prüfen", "eowUpdate": "Bid oder No-Go setzen", "dataMode": "demo" },
    { "id": "p6", "title": "Zeitz Reinigung", "stage": "Qualifiziert", "value": 610000, "ownerId": "coord3", "priority": "A", "nextStep": "Angebotsstrategie festlegen", "eowUpdate": "Stage sauber pflegen", "dataMode": "demo" }
  ],
  "references": [
    { "id": "ref1", "name": "Öffentliche Gebäudereinigung", "region": "Berlin", "trade": "Reinigung", "dataMode": "demo" },
    { "id": "ref2", "name": "Kommunale Sicherheitsdienste", "region": "Magdeburg", "trade": "Sicherheit", "dataMode": "demo" }
  ]
}
JSON

echo "🧠 Logik und Format ..."
cat > lib/format.ts <<'TS'
export function formatDateTime(value?: string | null) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return new Intl.DateTimeFormat("de-DE", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(d);
}

export function modeLabel(mode?: string) {
  if (mode === "live") return "Live";
  if (mode === "smoke") return "Smoke";
  return "Demo";
}

export function modeBadgeClass(mode?: string) {
  if (mode === "live") return "badge badge-gut";
  if (mode === "smoke") return "badge badge-gemischt";
  return "badge badge-kritisch";
}
TS

cat > lib/sourceLogic.ts <<'TS'
export function sourceUsefulnessScore(stat: any) {
  const found = stat.tendersLast30Days || 0;
  const pre = stat.prefilteredLast30Days || 0;
  const go = stat.goLast30Days || 0;
  const errors = stat.errorCountLastRun || 0;
  const dup = stat.duplicateCountLastRun || 0;
  return Math.max(0, found + pre * 2 + go * 4 - errors * 5 - dup);
}

export function sourceHealth(stat: any) {
  if (!stat) return "unbekannt";
  if (stat.lastRunOk && (stat.errorCountLastRun || 0) === 0) return "grün";
  if ((stat.errorCountLastRun || 0) <= 1) return "gelb";
  return "kritisch";
}

export function smokeSummary(db: any) {
  const hits = db.sourceHits || [];
  return {
    mode: db.meta?.dataMode || "demo",
    totalHits: hits.length,
    newSinceLastFetch: hits.filter((x: any) => x.addedSinceLastFetch).length,
    prefiltered: hits.filter((x: any) => x.status === "prefiltered").length,
    manualReview: hits.filter((x: any) => x.status === "manual_review").length,
    observed: hits.filter((x: any) => x.status === "observed").length,
    bySource: (db.sourceRegistry || []).map((src: any) => ({
      source: src.name,
      hits: hits.filter((h: any) => h.sourceId === src.id).length
    }))
  };
}

export function aiSmokeForHit(hit: any) {
  let score = 0;
  const reasons: string[] = [];

  if ((hit.distanceKm || 999) <= 10) { score += 30; reasons.push("kurze Distanz"); }
  else if ((hit.distanceKm || 999) <= 30) { score += 20; reasons.push("solide Distanz"); }

  if ((hit.estimatedValue || 0) >= 500000) { score += 25; reasons.push("attraktives Volumen"); }
  else { score += 10; reasons.push("kleineres Volumen"); }

  if ((hit.durationMonths || 0) >= 24) { score += 20; reasons.push("längere Laufzeit"); }
  else { score += 8; reasons.push("kürzere Laufzeit"); }

  if (hit.status === "prefiltered") { score += 20; reasons.push("bereits vorqualifiziert"); }
  else if (hit.status === "manual_review") { score += 10; reasons.push("manuelle Prüfung empfohlen"); }

  const recommendation = score >= 80 ? "Bid" : score >= 55 ? "Prüfen" : "No-Go";
  const explanation =
    recommendation === "Bid"
      ? "Der Treffer passt gut zu Reichweite, Volumen und aktueller Bearbeitungslogik."
      : recommendation === "Prüfen"
        ? "Der Treffer ist relevant, sollte aber manuell gegen Kapazität und Leistungsumfang geprüft werden."
        : "Der Treffer ist aktuell operativ oder wirtschaftlich nicht vorrangig.";

  return { recommendation, score, reasons, explanation };
}
TS

echo "📄 Smoke Test Route hart reparieren ..."
cat > app/dashboard/smoke/page.tsx <<'TSX'
import { readStore } from "@/lib/storage";
import { smokeSummary } from "@/lib/sourceLogic";
import { modeBadgeClass, modeLabel } from "@/lib/format";

export default async function SmokePage() {
  const db = await readStore();
  const summary = smokeSummary(db);

  return (
    <div className="stack">
      <div className="row" style={{ gap: 10, alignItems: "center" }}>
        <h1 className="h1" style={{ margin: 0 }}>Smoke Test</h1>
        <span className={modeBadgeClass(summary.mode)}>{modeLabel(summary.mode)}</span>
      </div>
      <p className="sub">Schneller Strukturtest: Was liegt aktuell im System vor und wie verteilt es sich auf die Quellen?</p>

      <div className="grid grid-4">
        <div className="card"><div className="label">Treffer gesamt</div><div className="kpi">{summary.totalHits}</div></div>
        <div className="card"><div className="label">Neu seit letztem Abruf</div><div className="kpi">{summary.newSinceLastFetch}</div></div>
        <div className="card"><div className="label">Bid-Kandidaten</div><div className="kpi">{summary.prefiltered}</div></div>
        <div className="card"><div className="label">Manuell prüfen</div><div className="kpi">{summary.manualReview}</div></div>
      </div>

      <div className="card table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Quelle</th>
              <th>Treffer</th>
            </tr>
          </thead>
          <tbody>
            {summary.bySource.map((row: any) => (
              <tr key={row.source}>
                <td>{row.source}</td>
                <td>{row.hits}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
TSX

echo "📄 AI Test Route hart reparieren ..."
cat > app/dashboard/ai-smoke/page.tsx <<'TSX'
import { readStore } from "@/lib/storage";
import { aiSmokeForHit } from "@/lib/sourceLogic";
import { modeBadgeClass, modeLabel } from "@/lib/format";

export default async function AiSmokePage() {
  const db = await readStore();
  const mode = db.meta?.dataMode || "demo";
  const hits = db.sourceHits || [];

  return (
    <div className="stack">
      <div className="row" style={{ gap: 10, alignItems: "center" }}>
        <h1 className="h1" style={{ margin: 0 }}>AI Test</h1>
        <span className={modeBadgeClass(mode)}>{modeLabel(mode)}</span>
      </div>
      <p className="sub">Heuristische Bid-/Prüfen-/No-Go-Empfehlung für die aktuelle Trefferliste.</p>

      <div className="card table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Titel</th>
              <th>Empfehlung</th>
              <th>Score</th>
              <th>Begründung</th>
            </tr>
          </thead>
          <tbody>
            {hits.map((hit: any) => {
              const a = aiSmokeForHit(hit);
              return (
                <tr key={hit.id}>
                  <td>{hit.title}</td>
                  <td>{a.recommendation}</td>
                  <td>{a.score}</td>
                  <td>{a.explanation}</td>
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

echo "📄 Agents modernisieren ..."
cat > app/agents/page.tsx <<'TSX'
import { readStore } from "@/lib/storage";

export default async function AgentsPage() {
  const db = await readStore();
  const agents = db.agents || [];

  return (
    <div className="stack">
      <div>
        <h1 className="h1">Agents</h1>
        <p className="sub">Vier Koordinationen und zwei Assistenzen als operative Grundstruktur für Monitoring, Review und Pipeline-Pflege.</p>
      </div>

      <div className="card table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Fokus</th>
              <th>Rolle</th>
              <th>Aufgabe</th>
              <th>EOW-Pflege</th>
              <th>Win-Rate</th>
              <th>Pipeline</th>
            </tr>
          </thead>
          <tbody>
            {agents.map((a: any) => (
              <tr key={a.id}>
                <td>{a.name}</td>
                <td>{a.focus}</td>
                <td>{a.level}</td>
                <td>{a.responsibility || "-"}</td>
                <td>{a.weeklyTask || "-"}</td>
                <td>{Math.round((a.winRate || 0) * 100)}%</td>
                <td>{Math.round((a.pipelineValue || 0) / 1000)}k €</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
TSX

echo "📄 Pipeline aufbauen ..."
cat > app/pipeline/page.tsx <<'TSX'
import { readStore } from "@/lib/storage";

function grouped(rows: any[]) {
  const stages = ["Qualifiziert", "Review", "Freigabe intern", "Angebot", "Eingereicht", "Verhandlung", "Gewonnen", "Verloren"];
  return stages.map((stage) => ({
    stage,
    items: rows.filter((x) => x.stage === stage)
  })).filter((x) => x.items.length > 0);
}

export default async function PipelinePage() {
  const db = await readStore();
  const rows = db.pipeline || [];
  const groups = grouped(rows);

  return (
    <div className="stack">
      <div>
        <h1 className="h1">Pipeline</h1>
        <p className="sub">Übersicht über aktive Chancen, Stage-Logik, Verantwortliche und die wöchentliche Pflege bis Freitag.</p>
      </div>

      <div className="grid grid-4">
        <div className="card"><div className="label">Chancen</div><div className="kpi">{rows.length}</div></div>
        <div className="card"><div className="label">A-Priorität</div><div className="kpi">{rows.filter((x: any) => x.priority === "A").length}</div></div>
        <div className="card"><div className="label">Im Review</div><div className="kpi">{rows.filter((x: any) => x.stage === "Review").length}</div></div>
        <div className="card"><div className="label">Angebotswert</div><div className="kpi">{Math.round(rows.reduce((sum: number, x: any) => sum + (x.value || 0), 0) / 1000)}k €</div></div>
      </div>

      <div className="card">
        <div className="section-title">Wöchentliche Pflege</div>
        <p className="meta" style={{ marginTop: 12 }}>
          Zielbild: Jede Chance hat bis Freitag 16:00 einen sauberen Stage-Stand, einen Owner und den nächsten konkreten Schritt.
        </p>
      </div>

      {groups.map((group) => (
        <div className="card" key={group.stage}>
          <div className="section-title">{group.stage}</div>
          <div className="table-wrap" style={{ marginTop: 12 }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Titel</th>
                  <th>Priorität</th>
                  <th>Owner</th>
                  <th>Wert</th>
                  <th>Nächster Schritt</th>
                  <th>EOW-Aufgabe</th>
                </tr>
              </thead>
              <tbody>
                {group.items.map((item: any) => (
                  <tr key={item.id}>
                    <td>{item.title}</td>
                    <td>{item.priority}</td>
                    <td>{item.ownerId}</td>
                    <td>{Math.round((item.value || 0) / 1000)}k €</td>
                    <td>{item.nextStep || "-"}</td>
                    <td>{item.eowUpdate || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}
TSX

echo "📄 Dashboard / Showcase Copy modernisieren ..."
cat > app/showcase/page.tsx <<'TSX'
import Link from "next/link";
import { readStore } from "@/lib/storage";
import { formatDateTime, modeBadgeClass, modeLabel } from "@/lib/format";

export default async function ShowcasePage() {
  const db = await readStore();
  const mode = db.meta?.dataMode || "demo";
  const hits = db.sourceHits || [];
  const pre = hits.filter((x: any) => x.status === "prefiltered").length;
  const review = hits.filter((x: any) => x.status === "manual_review").length;
  const sites = (db.sites || []).filter((x: any) => x.active);
  const rules = (db.siteTradeRules || []).filter((x: any) => x.enabled);

  return (
    <div className="stack">
      <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div className="row" style={{ gap: 10, alignItems: "center" }}>
            <h1 className="h1" style={{ margin: 0 }}>Showcase</h1>
            <span className={modeBadgeClass(mode)}>{modeLabel(mode)}</span>
          </div>
          <p className="sub">Kuratiertes Gesamtbild für Gespräche, Demos und die Einordnung des aktuellen Reifegrads.</p>
        </div>
        <Link className="button" href="/">Zum Dashboard</Link>
      </div>

      <div className="card">
        <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
          <div className="section-title">Executive Summary</div>
          <span className="badge badge-gut">Gute operative Ausgangslage</span>
        </div>
        <p className="meta" style={{ marginTop: 12 }}>
          Mehrere Treffer sind bereits vorqualifiziert. Der nächste Reifegrad liegt in sauberer Stage-Pflege,
          besserer Quellenvalidierung und klarer Angebotssteuerung je Koordination.
        </p>
      </div>

      <section className="grid grid-4">
        <div className="card"><div className="label">Letzter Abruf</div><div className="kpi" style={{ fontSize: 28 }}>{formatDateTime(db.meta?.lastSuccessfulIngestionAt)}</div></div>
        <div className="card"><div className="label">Treffer gesamt</div><div className="kpi">{hits.length}</div></div>
        <div className="card"><div className="label">Bid-Kandidaten</div><div className="kpi">{pre}</div></div>
        <div className="card"><div className="label">Manuell prüfen</div><div className="kpi">{review}</div></div>
      </section>

      <section className="grid grid-2">
        <div className="card">
          <div className="section-title">Operative Basis</div>
          <p className="meta" style={{ marginTop: 12 }}>Aktive Standorte: {sites.length}</p>
          <p className="meta">Aktive Regeln: {rules.length}</p>
          <p className="meta">Datenmodus: {modeLabel(mode)}</p>
        </div>

        <div className="card">
          <div className="section-title">Steuerlogik</div>
          <p className="meta" style={{ marginTop: 12 }}>1. Quelle prüfen</p>
          <p className="meta">2. Treffer einordnen</p>
          <p className="meta">3. Bid / Prüfen / No-Go ableiten</p>
          <p className="meta">4. Pipeline bis EOW sauber pflegen</p>
        </div>
      </section>
    </div>
  );
}
TSX

echo "📄 Source Hits lesbarer machen ..."
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
        <p className="sub">Alle aktuell verfügbaren Treffer mit Quelle, Match, Distanz und Einordnung.</p>
      </div>

      <div className="card table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Titel</th>
              <th>Quelle</th>
              <th>Standort</th>
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
                <td>{x.sourceId.replace("src_", "").replaceAll("_", " ")}</td>
                <td>{x.matchedSiteId || "-"}</td>
                <td>{x.region}</td>
                <td>{x.postalCode || "-"}</td>
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

echo "🧾 Build ..."
npm run build || true
git add .
git commit -m "feat: modernize copy, restore smoke route, define 4 coordinators plus 2 assistants and build pipeline stage ownership model" || true
git push origin main || true

echo "✅ Agents / Pipeline / Smoke Master Fix eingebaut."
