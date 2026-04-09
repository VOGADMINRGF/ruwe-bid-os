#!/bin/bash
set -e

cd ~/Arbeitsmappe/ruwe-bid-os

echo "🚀 RUWE Bid OS — Volumen & Fokus Dashboard Upgrade"

mkdir -p lib

echo "🧠 Neue Management-Metriken ..."
cat > lib/managementMetrics.ts <<'TS'
function n(v: any) {
  const x = Number(v || 0);
  return Number.isFinite(x) ? x : 0;
}

function decisionOf(hit: any) {
  return hit?.aiRecommendation || (
    hit?.status === "prefiltered" ? "Bid" :
    hit?.status === "manual_review" ? "Prüfen" :
    "No-Go"
  );
}

function sumVolume(rows: any[]) {
  return rows.reduce((s, x) => s + n(x?.estimatedValue), 0);
}

export function portfolioSummary(db: any) {
  const hits = db?.sourceHits || [];
  const bid = hits.filter((x: any) => decisionOf(x) === "Bid");
  const review = hits.filter((x: any) => decisionOf(x) === "Prüfen");
  const noGo = hits.filter((x: any) => decisionOf(x) === "No-Go");

  return {
    totalCount: hits.length,
    totalVolume: sumVolume(hits),
    bidCount: bid.length,
    bidVolume: sumVolume(bid),
    reviewCount: review.length,
    reviewVolume: sumVolume(review),
    noGoCount: noGo.length,
    noGoVolume: sumVolume(noGo)
  };
}

export function highAttentionCases(db: any) {
  const hits = db?.sourceHits || [];
  return [...hits]
    .map((x: any) => {
      const duration = n(x.durationMonths);
      const volume = n(x.estimatedValue);
      const distance = n(x.distanceKm || 999);
      let attention = 0;

      if (duration >= 36) attention += 35;
      else if (duration >= 24) attention += 24;
      else if (duration >= 12) attention += 12;

      if (volume >= 1000000) attention += 35;
      else if (volume >= 500000) attention += 25;
      else if (volume >= 250000) attention += 15;

      if (distance <= 10) attention += 15;
      else if (distance <= 30) attention += 8;

      if ((x.aiRecommendation || x.status) === "Bid" || x.status === "prefiltered") attention += 20;
      else if ((x.aiRecommendation || x.status) === "Prüfen" || x.status === "manual_review") attention += 10;

      return {
        ...x,
        attentionScore: attention
      };
    })
    .sort((a: any, b: any) => b.attentionScore - a.attentionScore)
    .slice(0, 8);
}

export function missingCoverageCases(db: any) {
  const hits = db?.sourceHits || [];
  return hits
    .filter((x: any) => !x.matchedSiteId || !x.trade || x.trade === "Sonstiges" || n(x.distanceKm) >= 80)
    .map((x: any) => ({
      ...x,
      gapReason:
        !x.matchedSiteId ? "kein Standortmatch" :
        (!x.trade || x.trade === "Sonstiges") ? "Gewerk unklar" :
        "Radius / Abdeckung schwach"
    }))
    .sort((a: any, b: any) => n(b.estimatedValue) - n(a.estimatedValue))
    .slice(0, 10);
}

export function longRunningCases(db: any) {
  const hits = db?.sourceHits || [];
  return [...hits]
    .filter((x: any) => n(x.durationMonths) > 0)
    .sort((a: any, b: any) => n(b.durationMonths) - n(a.durationMonths) || n(b.estimatedValue) - n(a.estimatedValue))
    .slice(0, 8);
}

export function highestVolumeCases(db: any) {
  const hits = db?.sourceHits || [];
  return [...hits]
    .sort((a: any, b: any) => n(b.estimatedValue) - n(a.estimatedValue))
    .slice(0, 8);
}

export function managementNarrative(db: any) {
  const p = portfolioSummary(db);
  const longRun = longRunningCases(db)[0];
  const highVol = highestVolumeCases(db)[0];
  const gaps = missingCoverageCases(db);

  const lead =
    p.bidVolume > 0
      ? `Aktuell sind rund ${Math.round(p.bidVolume / 1000)}k € als aktive Bid-Chance einzuordnen.`
      : "Aktuell ist noch kein belastbares Bid-Volumen sichtbar.";

  const second =
    highVol
      ? `Größter sichtbarer Fall: ${highVol.trade || "Sonstiges"} in ${highVol.region || "Unbekannt"} mit rund ${Math.round(n(highVol.estimatedValue) / 1000)}k €.`
      : "Noch kein größter Fall ableitbar.";

  const third =
    longRun
      ? `Längste relevante Laufzeit: ${longRun.trade || "Sonstiges"} in ${longRun.region || "Unbekannt"} mit ${n(longRun.durationMonths)} Monaten.`
      : "Noch keine Laufzeitbesonderheit sichtbar.";

  const fourth =
    gaps.length
      ? `${gaps.length} sichtbare Fälle zeigen aktuell Lücken bei Standort, Gewerk oder Radius.`
      : "Aktuell sind keine größeren Abdeckungslücken sichtbar.";

  return { lead, second, third, fourth };
}
TS

echo "📊 Dashboard auf Management-Volumen trimmen ..."
cat > app/page.tsx <<'TSX'
import Link from "next/link";
import { readStore } from "@/lib/storage";
import { formatDateTime, modeLabel, modeBadgeClass } from "@/lib/format";
import { aggregateHitsByRegionAndTrade } from "@/lib/sourceLogic";
import { topDeadlineStats, topForecastCards, sourcePerformanceRows, pipelineStageSummary } from "@/lib/dashboardLogic";
import { portfolioSummary, highAttentionCases, missingCoverageCases, longRunningCases, highestVolumeCases, managementNarrative } from "@/lib/managementMetrics";

function DecisionCard({ href, label, value, sub }: { href: string; label: string; value: string | number; sub: string }) {
  return (
    <Link href={href} className="card">
      <div className="label">{label}</div>
      <div className="kpi">{value}</div>
      <div className="meta" style={{ marginTop: 10 }}>{sub}</div>
    </Link>
  );
}

function euroK(v: number) {
  return `${Math.round((v || 0) / 1000)}k €`;
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
  const highVolume = highestVolumeCases(db);
  const gaps = missingCoverageCases(db);
  const mode = meta.dataMode || "test";

  return (
    <div className="stack">
      <section className="stack" style={{ gap: 8 }}>
        <h1 className="h1">Ausschreibungen gezielt steuern.</h1>
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
            <p className="meta" style={{ marginTop: 14 }}>{narrative.lead}</p>
            <p className="meta">{narrative.second}</p>
            <p className="meta">{narrative.third}</p>
            <p className="meta">{narrative.fourth}</p>
          </div>
        </div>
      </section>

      <section className="grid grid-6">
        <DecisionCard href="/source-hits" label="Ausschreibungsvolumen" value={euroK(portfolio.totalVolume)} sub={`${portfolio.totalCount} Treffer gesamt`} />
        <DecisionCard href="/source-hits?status=prefiltered" label="Empfohlen" value={euroK(portfolio.bidVolume)} sub={`${portfolio.bidCount} Bid-Kandidaten`} />
        <DecisionCard href="/source-hits?status=manual_review" label="Manuell prüfen" value={euroK(portfolio.reviewVolume)} sub={`${portfolio.reviewCount} Prüffälle`} />
        <DecisionCard href="/source-hits" label="No-Bid / Beobachten" value={euroK(portfolio.noGoVolume)} sub={`${portfolio.noGoCount} derzeit nicht priorisiert`} />
        <DecisionCard href="/dashboard/deadlines" label="Fristen 7 Tage" value={deadlines.due7} sub="Sofort handeln" />
        <DecisionCard href="/sites" label="Standorte / Regeln" value={`${(db.sites || []).filter((x: any) => x.active).length} / ${(db.siteTradeRules || []).filter((x: any) => x.enabled).length}`} sub="Aktive Abdeckung" />
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
                    <td>{euroK(row.volume)}</td>
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
              <div className="stage-value">{euroK(stage.value)}</div>
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
                    <td>{euroK(row.volume)}</td>
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
                  <th>Gewerk</th>
                  <th>Volumen</th>
                  <th>Laufzeit</th>
                </tr>
              </thead>
              <tbody>
                {highAttention.map((row: any) => (
                  <tr key={row.id}>
                    <td>{row.title}</td>
                    <td>{row.region || "-"}</td>
                    <td>{row.trade || "-"}</td>
                    <td>{euroK(Number(row.estimatedValue || 0))}</td>
                    <td>{row.durationMonths || "-"} Mon.</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <div className="section-title">Höchste Laufzeiten</div>
          <div className="meta" style={{ marginTop: 8, marginBottom: 14 }}>
            Relevant für langfristige Ertrags- und Kapazitätsplanung.
          </div>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Titel</th>
                  <th>Region</th>
                  <th>Gewerk</th>
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
            Potenziell interessante Fälle, die derzeit nicht sauber aufgestellt sind.
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
                    <td>{euroK(Number(row.estimatedValue || 0))}</td>
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
TSX

npm run build || true
git add .
git commit -m "feat: add management volume, bid/no-bid split and focus-case dashboard sections" || true
git push origin main || true

echo "✅ Volumen- und Fokusdashboard eingebaut."
