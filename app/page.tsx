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
