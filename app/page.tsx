import Link from "next/link";
import { readStore } from "@/lib/storage";
import { formatDateTime, modeLabel, modeBadgeClass } from "@/lib/format";
import { aggregateHitsByRegionAndTrade } from "@/lib/sourceLogic";
import { topDeadlineStats, topForecastCards, sourcePerformanceRows, pipelineStageSummary } from "@/lib/dashboardLogic";
import { portfolioSummary, highAttentionCases, missingCoverageCases, longRunningCases, managementNarrative } from "@/lib/managementMetrics";
import { formatCurrencyCompact } from "@/lib/numberFormat";

function DecisionCard({ href, label, value, sub }: { href: string; label: string; value: string; sub: string }) {
  return (
    <Link href={href} className="card">
      <div className="label">{label}</div>
      <div className="kpi-compact">{value}</div>
      <div className="metric-sub">{sub}</div>
    </Link>
  );
}

export default async function DashboardPage() {
  const db = await readStore();
  const meta = db.meta || {};
  const hits = db.sourceHits || [];
  const deadlines = topDeadlineStats(db);
  const forecastCards = topForecastCards(db);
  const sourceRows = sourcePerformanceRows(db);
  const grouped = aggregateHitsByRegionAndTrade(hits).slice(0, 10);
  const stages = pipelineStageSummary(db);
  const portfolio = portfolioSummary(db);
  const narrative = managementNarrative(db);
  const highAttention = highAttentionCases(db);
  const longRun = longRunningCases(db);
  const gaps = missingCoverageCases(db);
  const mode = meta.dataMode || "live";

  return (
    <div className="stack">
      <section className="stack" style={{ gap: 8 }}>
        <h1 className="h1"><span className="headline-accent">Ausschreibungen</span> gezielt steuern.</h1>
        <p className="sub">
          Steuerzentrale für Ausschreibungen nach Region, Geschäftsfeld, Radius, Quelle und Frist.
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

            <div className="toolbar" style={{ marginTop: 8 }}>
              <Link className="button" href="/api/ops/live-ingest?redirect=1">Abruf starten</Link>
              <Link className="button-secondary" href="/api/ops/analyze-hits?redirect=1">AI Analyse</Link>
              <Link className="button-secondary" href="/dashboard/forecast">Forecast</Link>
              <Link className="button-secondary" href="/dashboard/deadlines">Fristen</Link>
            </div>
          </div>

          <div className="card soft">
            <div className="section-title">Management-Ableitung</div>
            <p className="meta" style={{ marginTop: 14 }}>{narrative.lead}</p>
            <p className="meta">{narrative.second}</p>
            <p className="meta">{narrative.third}</p>
            <p className="meta">{narrative.fourth}</p>
          </div>
        </div>
      </section>

      <section className="grid grid-6">
        <DecisionCard href="/source-hits" label="Ausschreibungsvolumen" value={formatCurrencyCompact(portfolio.totalVolume)} sub={`${portfolio.totalCount} Treffer`} />
        <DecisionCard href="/source-hits?decision=Bid" label="Empfohlen" value={formatCurrencyCompact(portfolio.bidVolume)} sub={`${portfolio.bidCount} Kandidaten`} />
        <DecisionCard href="/source-hits?decision=Prüfen" label="Manuell prüfen" value={formatCurrencyCompact(portfolio.reviewVolume)} sub={`${portfolio.reviewCount} Prüffälle`} />
        <DecisionCard href="/source-hits?decision=No-Go" label="No-Bid / Beobachten" value={formatCurrencyCompact(portfolio.noGoVolume)} sub={`${portfolio.noGoCount} derzeit nicht priorisiert`} />
        <DecisionCard href="/pipeline?window=7d" label="Fristen 7 Tage" value={`${deadlines.due7}`} sub="sofort handeln" />
        <DecisionCard href="/sites" label="Standorte / Regeln" value={`${(db.sites || []).filter((x: any) => x.active).length} / ${(db.siteTradeRules || []).filter((x: any) => x.enabled).length}`} sub="aktive Abdeckung" />
      </section>

      <section className="grid grid-2">
        <div className="card">
          <div className="section-title">Wo lohnt Fokus?</div>
          <div className="meta" style={{ marginTop: 8, marginBottom: 14 }}>
            Geschäftsfelder und Regionen mit attraktivem Marktbild.
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
                    <td>{formatCurrencyCompact(row.volume)}</td>
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
          Stages und Volumen im Überblick.
        </div>
        <div className="stage-board">
          {stages.map((stage: any) => (
            <div key={stage.stage} className="stage-card">
              <div className="label">{stage.stage}</div>
              <div className="stage-count">{stage.count}</div>
              <div className="stage-value">{formatCurrencyCompact(stage.value)}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="grid grid-2">
        <div className="card">
          <div className="section-title">Region × Geschäftsfeld × Volumen</div>
          <div className="meta" style={{ marginTop: 8, marginBottom: 14 }}>
            Sichtbare Marktsegmente mit aktuellem Volumenbild.
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
                    <td>{formatCurrencyCompact(row.volume)}</td>
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
            Die wichtigsten unmittelbaren Arbeitsfelder.
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
                {portfolio.reviewCount} Treffer benötigen manuelle Entscheidung.
              </div>
            </div>
            <div className="card soft">
              <div className="label">Abdeckung</div>
              <div className="meta" style={{ marginTop: 10 }}>
                {gaps.length} Fälle zeigen aktuell Lücken bei Standort, Gewerk oder Radius.
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-3">
        <div className="card">
          <div className="section-title">Besonders zu fokussieren</div>
          <div className="meta" style={{ marginTop: 8, marginBottom: 14 }}>
            Auffällig wegen Kombination aus Volumen, Laufzeit und Fit.
          </div>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Titel</th>
                  <th>Region</th>
                  <th>Geschäftsfeld</th>
                  <th>Volumen</th>
                </tr>
              </thead>
              <tbody>
                {highAttention.map((row: any) => (
                  <tr key={row.id}>
                    <td>{row.title}</td>
                    <td>{row.region || "-"}</td>
                    <td>{row.trade || "-"}</td>
                    <td>{formatCurrencyCompact(Number(row.estimatedValue || 0))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <div className="section-title">Höchste Laufzeiten</div>
          <div className="meta" style={{ marginTop: 8, marginBottom: 14 }}>
            Relevant für langfristige Kapazitätsplanung.
          </div>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Titel</th>
                  <th>Region</th>
                  <th>Geschäftsfeld</th>
                  <th>Laufzeit</th>
                </tr>
              </thead>
              <tbody>
                {longRun.map((row: any) => (
                  <tr key={row.id}>
                    <td>{row.title}</td>
                    <td>{row.region || "-"}</td>
                    <td>{row.trade || "-"}</td>
                    <td>{row.durationMonths || "-"} Mon.</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <div className="section-title">Abdeckungslücken</div>
          <div className="meta" style={{ marginTop: 8, marginBottom: 14 }}>
            Potenziell interessante Fälle ohne sauberen Fit.
          </div>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Titel</th>
                  <th>Region</th>
                  <th>Volumen</th>
                  <th>Lücke</th>
                </tr>
              </thead>
              <tbody>
                {gaps.map((row: any) => (
                  <tr key={row.id}>
                    <td>{row.title}</td>
                    <td>{row.region || "-"}</td>
                    <td>{formatCurrencyCompact(Number(row.estimatedValue || 0))}</td>
                    <td>{row.gapReason}</td>
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
