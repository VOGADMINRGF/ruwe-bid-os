#!/bin/bash
set -e

cd "$(pwd)"

echo "🔧 RUWE Bid OS — Demo/Validity/Format Fix"

mkdir -p lib

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

export function dataModeLabel(mode?: string) {
  if (mode === "live") return "Live";
  if (mode === "smoke") return "Smoke";
  return "Demo";
}

export function dataModeBadgeClass(mode?: string) {
  if (mode === "live") return "badge badge-gut";
  if (mode === "smoke") return "badge badge-gemischt";
  return "badge badge-kritisch";
}
TS

python3 - <<'PY'
import json
from pathlib import Path

p = Path("data/db.json")
db = json.loads(p.read_text())

meta = db.get("meta", {})
meta["dataMode"] = meta.get("dataMode", "demo")
meta["dataValidityNote"] = "Aktuell Demo-/Smoke-Stand, bis echte Connectoren produktiv laufen."
db["meta"] = meta

for key in ["sourceRegistry", "sourceStats", "sourceHits", "sites", "siteTradeRules", "buyers", "agents", "tenders", "pipeline", "references"]:
    rows = db.get(key, [])
    if isinstance(rows, list):
        for row in rows:
            row.setdefault("dataMode", "demo")

p.write_text(json.dumps(db, ensure_ascii=False, indent=2))
PY

cat > app/page.tsx <<'TSX'
import Link from "next/link";
import { readStore } from "@/lib/storage";
import { sourceUsefulnessScore, aggregateHitsByRegionAndTrade } from "@/lib/sourceLogic";
import { formatDateTime, dataModeBadgeClass, dataModeLabel } from "@/lib/format";

function KpiCard({ href, label, value, sub }: { href: string; label: string; value: string | number; sub?: string }) {
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
  const grouped = aggregateHitsByRegionAndTrade(hits);

  const rows = registry.map((src: any) => {
    const stat = stats.find((s: any) => s.id === src.id) || {};
    return { ...src, ...stat, usefulnessScore: sourceUsefulnessScore(stat) };
  }).sort((a: any, b: any) => b.usefulnessScore - a.usefulnessScore);

  const bestSource = rows[0];
  const mode = meta.dataMode || "demo";

  return (
    <div className="stack">
      <section>
        <h1 className="h1">Vertriebssteuerung neu denken.</h1>
        <p className="sub">
          Betriebshof-, Gewerk-, Radius- und Quellen-gesteuerte Steuerzentrale für RUWE.
        </p>
      </section>

      <section className="card">
        <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
          <div className="stack" style={{ gap: 6 }}>
            <div className="row" style={{ gap: 10, alignItems: "center" }}>
              <div className="label">Monitoring Schnellblick</div>
              <span className={dataModeBadgeClass(mode)}>{dataModeLabel(mode)}</span>
            </div>
            <div className="meta">Letzter Abruf: {formatDateTime(meta.lastSuccessfulIngestionAt)}</div>
            <div className="meta">Letzte Quelle: {meta.lastSuccessfulIngestionSource || "-"}</div>
            <div className="meta">Datenlage: {meta.dataValidityNote || "-"}</div>
          </div>
          <div className="row">
            <Link className="button" href="/dashboard/smoke">Smoke</Link>
            <Link className="button-secondary" href="/dashboard/ai-smoke">AI Test</Link>
            <Link className="button-secondary" href="/dashboard/source-tests">Tests</Link>
            <Link className="linkish" href="/dashboard/monitoring">Details</Link>
          </div>
        </div>
      </section>

      <section className="grid grid-6">
        <KpiCard href="/dashboard/new-hits" label="Neu seit letztem Abruf" value={newHits.length} sub={`${dataModeLabel(mode)}-Treffer`} />
        <KpiCard href="/source-hits" label="Gesamt Treffer" value={hits.length} sub="Öffnet alle Treffer" />
        <KpiCard href="/source-hits?status=prefiltered" label="Vorausgewählt" value={prefiltered.length} sub="Bid-Kandidaten" />
        <KpiCard href="/source-hits?status=manual_review" label="Manuell prüfen" value={manual.length} sub="Offene Entscheidungen" />
        <KpiCard href="/sites" label="Standorte / Regeln" value={`${sites.length} / ${rules.length}`} sub="Aktive Abdeckung" />
        <KpiCard href="/dashboard/monitoring" label="Sinnvollste Quelle" value={bestSource?.name || "-"} sub={`Score: ${bestSource?.usefulnessScore || 0}`} />
      </section>

      <section className="grid grid-2">
        <div className="card">
          <div className="section-title">Quellen & Nutzen</div>
          <div className="meta" style={{ marginBottom: 12 }}>
            Aktuell sichtbare Werte stammen aus <strong>{dataModeLabel(mode)}</strong>-Daten, bis Live-Connectoren aktiv sind.
          </div>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Quelle</th>
                  <th>Modus</th>
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
                    <td>{dataModeLabel(row.dataMode || mode)}</td>
                    <td>{formatDateTime(row.lastFetchAt)}</td>
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
          <div className="meta" style={{ marginBottom: 12 }}>
            Dient aktuell als strukturierter Überblick und noch nicht als finaler Live-Forecast.
          </div>
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

cat > app/dashboard/monitoring/page.tsx <<'TSX'
import { readStore } from "@/lib/storage";
import { sourceHealth, sourceUsefulnessScore } from "@/lib/sourceLogic";
import { formatDateTime, dataModeLabel, dataModeBadgeClass } from "@/lib/format";

function healthBadge(health: string) {
  if (health === "gruen") return "badge badge-gut";
  if (health === "gelb") return "badge badge-gemischt";
  return "badge badge-kritisch";
}

export default async function MonitoringPage() {
  const db = await readStore();
  const registry = db.sourceRegistry || [];
  const stats = db.sourceStats || [];
  const mode = db.meta?.dataMode || "demo";

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
        <div className="row" style={{ gap: 10, alignItems: "center" }}>
          <h1 className="h1" style={{ margin: 0 }}>Monitoring</h1>
          <span className={dataModeBadgeClass(mode)}>{dataModeLabel(mode)}</span>
        </div>
        <p className="sub">Quelle, letzter Abruf, Nutzen, Fehler und Einordnung für RUWE.</p>
      </div>

      <div className="card table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Quelle</th>
              <th>Status</th>
              <th>Typ</th>
              <th>Modus</th>
              <th>Letzter Abruf</th>
              <th>Letzter Monat</th>
              <th>Seit letztem Abruf</th>
              <th>Vorausgewählt</th>
              <th>Go</th>
              <th>Score</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row: any) => (
              <tr key={row.id}>
                <td>{row.name}</td>
                <td><span className={healthBadge(row.health)}>{row.health}</span></td>
                <td>{row.type}</td>
                <td>{dataModeLabel(row.dataMode || mode)}</td>
                <td>{formatDateTime(row.lastFetchAt)}</td>
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
  );
}
TSX

cat > app/dashboard/source-tests/page.tsx <<'TSX'
import { readStore } from "@/lib/storage";
import { sourceHealth, sourceUsefulnessScore } from "@/lib/sourceLogic";
import { dataModeLabel, dataModeBadgeClass } from "@/lib/format";

function healthBadge(health: string) {
  if (health === "gruen") return "badge badge-gut";
  if (health === "gelb") return "badge badge-gemischt";
  return "badge badge-kritisch";
}

export default async function SourceTestsPage() {
  const db = await readStore();
  const registry = db.sourceRegistry || [];
  const stats = db.sourceStats || [];
  const mode = db.meta?.dataMode || "demo";

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
        <div className="row" style={{ gap: 10, alignItems: "center" }}>
          <h1 className="h1" style={{ margin: 0 }}>Source Tests</h1>
          <span className={dataModeBadgeClass(mode)}>{dataModeLabel(mode)}</span>
        </div>
        <p className="sub">Prüft derzeit den strukturellen Teststand. Solange keine Live-Connectoren aktiv sind, sind die Werte Demo/Smoke.</p>
      </div>

      <div className="card table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Quelle</th>
              <th>Status</th>
              <th>Modus</th>
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
                <td>{dataModeLabel(row.dataMode || mode)}</td>
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

npm run build || true
git add data/db.json lib/format.ts app/page.tsx app/dashboard/monitoring/page.tsx app/dashboard/source-tests/page.tsx
git commit -m "fix: label demo/smoke data clearly and format timestamps for friendlier monitoring" || true
git push origin main || true

echo "✅ Demo/Validity/Format Fix eingebaut."
