import Link from "next/link";
import { readStore } from "@/lib/storage";
import { formatDateTime, modeLabel, modeBadgeClass } from "@/lib/format";
import { aggregateHitsByRegionAndTrade } from "@/lib/sourceLogic";
import { topDeadlineStats, topForecastCards, sourcePerformanceRows, pipelineStageSummary, managementSummary } from "@/lib/dashboardLogic";

function DecisionCard({ href, label, value, sub }: { href: string; label: string; value: string | number; sub: string }) {
  return (
    <Link href={href} className="card">
      <div className="label">{label}</div>
      <div className="kpi">{value}</div>
      <div className="meta" style={{ marginTop: 10 }}>{sub}</div>
    </Link>
  );
}

export default async function DashboardPage() {
  const db = await readStore();
  const meta = db.meta || {};
  const hits = db.sourceHits || [];
  const management = managementSummary(db);
  const deadlines = topDeadlineStats(db);
  const forecastCards = topForecastCards(db);
  const sourceRows = sourcePerformanceRows(db);
  const grouped = aggregateHitsByRegionAndTrade(hits).slice(0, 10);
  const stages = pipelineStageSummary(db);
  const mode = meta.dataMode || "test";

  return (
    <div className="stack">
      <section className="stack" style={{ gap: 8 }}>
        <h1 className="h1">Ausschreibungen gezielt steuern.</h1>
        <p className="sub">
          Steuerzentrale für Ausschreibungen nach Region, Gewerk, Radius und Quelle.
        </p>
      </section>

      <section className="card">
        <div className="focus-callout">
          <div className="stack" style={{ gap: 10 }}>
            <div className="row" style={{ alignItems: "center", gap: 10 }}>
              <div className="section-title">Management-Schnellblick</div>
              <span className={modeBadgeClass(mode)}>Datenstand: {modeLabel(mode)}</span>
            </div>
            <div className="meta">Letzter Abruf: {formatDateTime(meta.lastSuccessfulIngestionAt)}</div>
            <div className="meta">Letzte Quelle: {meta.lastSuccessfulIngestionSource || "-"}</div>
            <div className="meta">{meta.dataValidityNote || "-"}</div>

            <div className="row" style={{ marginTop: 8 }}>
              <Link className="button" href="/api/ops/live-ingest?redirect=1">Abruf starten</Link>
              <Link className="button-secondary" href="/api/ops/analyze-hits?redirect=1">AI Analyse</Link>
              <Link className="button-secondary" href="/dashboard/forecast">Forecast</Link>
              <Link className="button-secondary" href="/dashboard/deadlines">Fristen</Link>
            </div>
          </div>

          <div className="card soft">
            <div className="section-title">Management-Ableitung</div>
            <p className="meta" style={{ marginTop: 14 }}>{management.leadText}</p>
            <p className="meta">{management.secondText}</p>
            <p className="meta" style={{ marginTop: 14 }}>
              Fristen in 7 Tagen: {deadlines.due7} · in 14 Tagen: {deadlines.due14} · überfällig: {deadlines.overdue}
            </p>
          </div>
        </div>
      </section>

      <section className="grid grid-5">
        <DecisionCard href="/source-hits" label="Neue Treffer" value={hits.filter((x: any) => x.addedSinceLastFetch).length} sub="Seit letztem Abruf" />
        <DecisionCard href="/source-hits?status=prefiltered" label="Bid-Kandidaten" value={management.bid} sub="Jetzt aktiv prüfen" />
        <DecisionCard href="/source-hits?status=manual_review" label="Reviews offen" value={management.review} sub="Manuelle Prüfung" />
        <DecisionCard href="/dashboard/deadlines" label="Fristen 7 Tage" value={deadlines.due7} sub="Sofort handeln" />
        <DecisionCard href="/sites" label="Betriebshöfe / Regeln" value={`${(db.sites || []).filter((x: any) => x.active).length} / ${(db.siteTradeRules || []).filter((x: any) => x.enabled).length}`} sub="Aktive Abdeckung" />
      </section>

      <section className="grid grid-2">
        <div className="card">
          <div className="section-title">Wo lohnt Fokus?</div>
          <div className="meta" style={{ marginTop: 8, marginBottom: 14 }}>
            Geschäftsfelder und Regionen mit dem stärksten aktuellen Marktbild.
          </div>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Geschäftsfeld</th>
                  <th>Region</th>
                  <th>Treffer</th>
                  <th>Volumen</th>
                  <th>Bid</th>
                  <th>Prüfen</th>
                </tr>
              </thead>
              <tbody>
                {forecastCards.map((row: any) => (
                  <tr key={`${row.trade}_${row.region}`}>
                    <td>{row.trade}</td>
                    <td>{row.region}</td>
                    <td>{row.count}</td>
                    <td>{Math.round(row.volume / 1000)}k €</td>
                    <td>{row.bids}</td>
                    <td>{row.reviews}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <div className="section-title">Quellenleistung</div>
          <div className="meta" style={{ marginTop: 8, marginBottom: 14 }}>
            Welche Quellen aktuell am meisten verwertbare Treffer liefern.
          </div>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Quelle</th>
                  <th>Letzter Abruf</th>
                  <th>Seit Abruf</th>
                  <th>Go</th>
                  <th>Score</th>
                </tr>
              </thead>
              <tbody>
                {sourceRows.slice(0, 6).map((row: any) => (
                  <tr key={row.id}>
                    <td>{row.name}</td>
                    <td>{formatDateTime(row.lastFetchAt)}</td>
                    <td>{row.tendersSinceLastFetch}</td>
                    <td>{row.goLast30Days}</td>
                    <td>{row.score}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="card">
        <div className="section-title">Pipeline-Steuerung</div>
        <div className="meta" style={{ marginTop: 8, marginBottom: 14 }}>
          Stages, Volumen und Bearbeitungsdruck im Überblick.
        </div>
        <div className="stage-board">
          {stages.map((stage: any) => (
            <div key={stage.stage} className="stage-card">
              <div className="label">{stage.stage}</div>
              <div className="stage-count">{stage.count}</div>
              <div className="stage-value">{Math.round(stage.value / 1000)}k €</div>
            </div>
          ))}
        </div>
      </section>

      <section className="grid grid-2">
        <div className="card">
          <div className="section-title">Region × Geschäftsfeld × Volumen</div>
          <div className="meta" style={{ marginTop: 8, marginBottom: 14 }}>
            Strukturbild der sichtbarsten Marktsegmente.
          </div>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Region</th>
                  <th>Geschäftsfeld</th>
                  <th>Quellen</th>
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
                    <td>{row.sources}</td>
                    <td>{row.count}</td>
                    <td>{Math.round(row.volume / 1000)}k €</td>
                    <td>{row.avgDurationMonths} Mon.</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <div className="section-title">Jetzt handeln</div>
          <div className="meta" style={{ marginTop: 8, marginBottom: 14 }}>
            Die drei wichtigsten unmittelbaren Arbeitsfelder.
          </div>
          <div className="stack">
            <div className="card soft">
              <div className="label">Fristen</div>
              <div className="meta" style={{ marginTop: 10 }}>
                {deadlines.due7} Chancen laufen innerhalb von 7 Tagen ab.
              </div>
            </div>
            <div className="card soft">
              <div className="label">Reviews</div>
              <div className="meta" style={{ marginTop: 10 }}>
                {management.review} Treffer benötigen manuelle Entscheidung.
              </div>
            </div>
            <div className="card soft">
              <div className="label">Fokus</div>
              <div className="meta" style={{ marginTop: 10 }}>
                {management.leadText}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
