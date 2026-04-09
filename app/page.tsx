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
