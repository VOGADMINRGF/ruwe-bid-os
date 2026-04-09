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
