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
