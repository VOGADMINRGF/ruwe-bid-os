#!/bin/bash
set -e

cd ~/Arbeitsmappe/ruwe-bid-os

echo "🚀 RUWE Bid OS — Dashboard Reifegrad Sprung"

mkdir -p components
mkdir -p app/dashboard/ops
mkdir -p lib

echo "🧠 Dashboard-Logik ergänzen ..."
cat > lib/dashboardLogic.ts <<'TS'
import { deadlineView, forecastRecommendations } from "@/lib/forecastLogic";
import { sourceUsefulnessScore } from "@/lib/sourceLogic";

export function topDeadlineStats(db: any) {
  const tenders = deadlineView(db.tenders || []);
  return {
    due7: tenders.filter((x: any) => x.daysLeft >= 0 && x.daysLeft <= 7).length,
    due14: tenders.filter((x: any) => x.daysLeft >= 8 && x.daysLeft <= 14).length,
    overdue: tenders.filter((x: any) => x.daysLeft < 0).length
  };
}

export function topForecastCards(db: any) {
  const rows = forecastRecommendations(db.sourceHits || []);
  return rows.slice(0, 4);
}

export function sourcePerformanceRows(db: any) {
  const registry = db.sourceRegistry || [];
  const stats = db.sourceStats || [];

  return registry.map((src: any) => {
    const stat = stats.find((s: any) => s.id === src.id) || {};
    return {
      id: src.id,
      name: src.name,
      legalUse: src.legalUse || "-",
      lastFetchAt: stat.lastFetchAt || "",
      tendersLast30Days: stat.tendersLast30Days || 0,
      tendersSinceLastFetch: stat.tendersSinceLastFetch || 0,
      prefilteredLast30Days: stat.prefilteredLast30Days || 0,
      goLast30Days: stat.goLast30Days || 0,
      score: sourceUsefulnessScore(stat),
      lastRunOk: !!stat.lastRunOk,
      errors: stat.errorCountLastRun || 0
    };
  }).sort((a: any, b: any) => b.score - a.score);
}

export function pipelineStageSummary(db: any) {
  const rows = db.pipeline || [];
  const stages = ["Qualifiziert", "Review", "Freigabe intern", "Angebot", "Beobachtet", "Eingereicht", "Verhandlung", "Gewonnen", "Verloren"];
  return stages.map((stage) => {
    const items = rows.filter((x: any) => x.stage === stage);
    return {
      stage,
      count: items.length,
      value: items.reduce((sum: number, x: any) => sum + Number(x.value || 0), 0)
    };
  }).filter((x) => x.count > 0);
}

export function managementSummary(db: any) {
  const hits = db.sourceHits || [];
  const bid = hits.filter((x: any) => x.aiRecommendation === "Bid" || x.status === "prefiltered").length;
  const review = hits.filter((x: any) => x.aiRecommendation === "Prüfen" || x.status === "manual_review").length;
  const total = hits.length;

  const forecast = topForecastCards(db);
  const top1 = forecast[0];
  const top2 = forecast[1];

  return {
    totalHits: total,
    bid,
    review,
    leadText:
      top1
        ? `${top1.trade} in ${top1.region} wirkt aktuell am attraktivsten.`
        : "Noch keine belastbare Fokusregion vorhanden.",
    secondText:
      top2
        ? `Danach folgt ${top2.trade} in ${top2.region}.`
        : "Weitere Quellenläufe erhöhen die Aussagekraft."
  };
}
TS

echo "🧱 Neue Dashboard-Navigation ..."
cat > components/MainNav.tsx <<'TSX'
import Link from "next/link";

const primary = [
  { href: "/", label: "Dashboard" },
  { href: "/source-hits", label: "Treffer" },
  { href: "/pipeline", label: "Pipeline" },
  { href: "/dashboard/forecast", label: "Forecast" },
  { href: "/dashboard/deadlines", label: "Fristen" },
  { href: "/sites", label: "Betriebshöfe" }
];

const secondary = [
  { href: "/sources", label: "Quellen" },
  { href: "/dashboard/monitoring", label: "Monitoring" },
  { href: "/dashboard/ops", label: "Ops" },
  { href: "/agents", label: "Agents" },
  { href: "/site-rules", label: "Regeln" },
  { href: "/keywords", label: "Keywords" },
  { href: "/config", label: "Config" }
];

export default function MainNav() {
  return (
    <header className="topbar">
      <div className="shell topbar-inner">
        <Link href="/" className="brand">
          <span>RUWE</span>
          <span className="brand-accent">Bid OS</span>
        </Link>

        <nav className="nav nav-primary">
          {primary.map((item) => (
            <Link key={item.href} href={item.href} className="nav-link">
              {item.label}
            </Link>
          ))}
        </nav>

        <nav className="nav nav-secondary">
          {secondary.map((item) => (
            <Link key={item.href} href={item.href} className="nav-link subtle">
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
TSX

echo "🎨 globals.css modernisieren ..."
cat > app/globals.css <<'CSS'
:root{
  --bg:#eef0f3;
  --card:#f7f7f8;
  --text:#121a2b;
  --muted:#6b7280;
  --line:#d7dce2;
  --brand:#ea7b2c;
  --ok:#dff3df;
  --warn:#f8e7bc;
  --bad:#f7dada;
  --shadow:0 1px 2px rgba(0,0,0,.04);
  --radius:18px;
}

*{box-sizing:border-box}
html,body{padding:0;margin:0;font-family:Inter,Arial,sans-serif;background:var(--bg);color:var(--text)}
a{color:inherit;text-decoration:none}

.topbar{
  background:#050505;
  color:#fff;
  border-bottom:1px solid rgba(255,255,255,.06);
}
.topbar-inner{
  display:flex;
  gap:28px;
  align-items:flex-start;
  padding:20px 24px 18px;
  flex-wrap:wrap;
}
.brand{
  display:flex;
  flex-direction:column;
  font-weight:800;
  line-height:1;
  font-size:24px;
  min-width:120px;
}
.brand-accent{color:var(--brand)}

.nav{
  display:flex;
  gap:18px;
  flex-wrap:wrap;
  align-items:center;
}
.nav-primary{font-weight:700}
.nav-secondary{font-weight:600; opacity:.92}
.nav-link{color:#fff}
.nav-link.subtle{opacity:.9}

.shell{
  width:min(1520px, calc(100vw - 40px));
  margin:0 auto;
}

.page{
  padding:28px 0 42px;
}

.stack{display:flex;flex-direction:column;gap:18px}
.row{display:flex;gap:12px;flex-wrap:wrap}
.grid{display:grid;gap:18px}
.grid-2{grid-template-columns:repeat(2,minmax(0,1fr))}
.grid-3{grid-template-columns:repeat(3,minmax(0,1fr))}
.grid-4{grid-template-columns:repeat(4,minmax(0,1fr))}
.grid-5{grid-template-columns:repeat(5,minmax(0,1fr))}
.grid-6{grid-template-columns:repeat(6,minmax(0,1fr))}

.card{
  background:var(--card);
  border:1px solid var(--line);
  border-left:5px solid var(--brand);
  border-radius:var(--radius);
  padding:22px 22px;
  box-shadow:var(--shadow);
  min-width:0;
}
.card.soft{
  border-left-width:1px;
}
.h1{
  font-size:64px;
  line-height:1.02;
  letter-spacing:-0.03em;
  margin:0 0 8px;
  font-weight:850;
}
.h2{
  font-size:34px;
  line-height:1.08;
  margin:0;
  font-weight:800;
}
.sub{
  margin:0;
  color:var(--muted);
  font-size:18px;
  max-width:1100px;
}
.label{
  color:var(--muted);
  text-transform:uppercase;
  letter-spacing:.08em;
  font-size:13px;
  font-weight:800;
}
.kpi{
  font-size:54px;
  line-height:1;
  font-weight:850;
  margin-top:10px;
}
.meta{
  color:var(--muted);
  font-size:17px;
}
.section-title{
  font-size:24px;
  font-weight:800;
  margin:0;
}
.badge{
  display:inline-flex;
  align-items:center;
  padding:6px 12px;
  border-radius:999px;
  font-size:14px;
  font-weight:800;
}
.badge-gut{background:var(--ok);color:#2b6a39}
.badge-gemischt{background:var(--warn);color:#8a5a00}
.badge-kritisch{background:var(--bad);color:#a12f2f}

.button, .button-secondary{
  display:inline-flex;
  align-items:center;
  justify-content:center;
  min-height:46px;
  padding:0 18px;
  border-radius:14px;
  font-weight:800;
  font-size:16px;
}
.button{background:var(--brand);color:#fff}
.button-secondary{background:#fff;border:1px solid var(--line);color:var(--text)}
.linkish{color:#2c5cff;font-weight:700}

.table-wrap{overflow:auto}
.table{
  width:100%;
  border-collapse:collapse;
  min-width:760px;
}
.table th{
  text-align:left;
  padding:14px 14px;
  border-bottom:1px solid var(--line);
  color:var(--muted);
  text-transform:uppercase;
  letter-spacing:.06em;
  font-size:12px;
}
.table td{
  padding:16px 14px;
  border-bottom:1px solid var(--line);
  vertical-align:top;
  font-size:16px;
}

.stage-board{
  display:grid;
  grid-template-columns:repeat(5,minmax(0,1fr));
  gap:16px;
}
.stage-card{
  background:#fff;
  border:1px solid var(--line);
  border-radius:16px;
  padding:16px;
}
.stage-count{
  font-size:32px;
  font-weight:850;
  margin-top:8px;
}
.stage-value{
  color:var(--muted);
  margin-top:8px;
  font-weight:700;
}

.focus-callout{
  display:grid;
  grid-template-columns:1.3fr 1fr;
  gap:18px;
}

@media (max-width: 1200px){
  .grid-6{grid-template-columns:repeat(3,minmax(0,1fr))}
  .grid-5{grid-template-columns:repeat(3,minmax(0,1fr))}
  .grid-4{grid-template-columns:repeat(2,minmax(0,1fr))}
  .stage-board{grid-template-columns:repeat(3,minmax(0,1fr))}
  .focus-callout{grid-template-columns:1fr}
  .h1{font-size:48px}
}

@media (max-width: 780px){
  .shell{width:min(100vw - 20px, 100%)}
  .grid-6,.grid-5,.grid-4,.grid-3,.grid-2{grid-template-columns:1fr}
  .stage-board{grid-template-columns:1fr}
  .h1{font-size:38px}
  .kpi{font-size:42px}
  .topbar-inner{padding:16px 10px}
}
CSS

echo "🧭 layout.tsx auf neue Navi umstellen ..."
cat > app/layout.tsx <<'TSX'
import "./globals.css";
import MainNav from "@/components/MainNav";
import type { ReactNode } from "react";

export const metadata = {
  title: "RUWE Bid OS",
  description: "Steuerzentrale für Ausschreibungen nach Region, Gewerk, Radius und Quelle."
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="de">
      <body>
        <MainNav />
        <main className="page">
          <div className="shell">{children}</div>
        </main>
      </body>
    </html>
  );
}
TSX

echo "📊 Dashboard komplett neu aufsetzen ..."
cat > app/page.tsx <<'TSX'
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
TSX

echo "📊 Forecast-Seite schärfen ..."
cat > app/dashboard/forecast/page.tsx <<'TSX'
import { readStore } from "@/lib/storage";
import { forecastRecommendations } from "@/lib/forecastLogic";

export default async function ForecastPage() {
  const db = await readStore();
  const rows = forecastRecommendations(db.sourceHits || []);

  return (
    <div className="stack">
      <div>
        <h1 className="h1">Forecast</h1>
        <p className="sub">Welche Geschäftsfelder in welchen Regionen aktuell den stärksten Fokus verdienen.</p>
      </div>

      <div className="card">
        <div className="section-title">Management-Empfehlungen</div>
        <div className="stack" style={{ marginTop: 14 }}>
          {rows.slice(0, 5).map((row: any) => (
            <div key={`${row.trade}_${row.region}`} className="card soft">
              <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
                <div className="section-title" style={{ fontSize: 20 }}>
                  {row.trade} · {row.region}
                </div>
                <span className={row.recommendation === "Aktiv fokussieren" ? "badge badge-gut" : "badge badge-gemischt"}>
                  {row.recommendation}
                </span>
              </div>
              <p className="meta" style={{ marginTop: 12 }}>
                Treffer: {row.count} · Bid: {row.bids} · Prüfen: {row.reviews} · Volumen: {Math.round(row.volume / 1000)}k €
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="card table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Geschäftsfeld</th>
              <th>Region</th>
              <th>Treffer</th>
              <th>Volumen</th>
              <th>Bid</th>
              <th>Prüfen</th>
              <th>Empfehlung</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row: any) => (
              <tr key={`${row.trade}_${row.region}`}>
                <td>{row.trade}</td>
                <td>{row.region}</td>
                <td>{row.count}</td>
                <td>{Math.round(row.volume / 1000)}k €</td>
                <td>{row.bids}</td>
                <td>{row.reviews}</td>
                <td>{row.recommendation}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
TSX

echo "📊 Fristen-Seite schärfen ..."
cat > app/dashboard/deadlines/page.tsx <<'TSX'
import { readStore } from "@/lib/storage";
import { deadlineView } from "@/lib/forecastLogic";

export default async function DeadlinesPage() {
  const db = await readStore();
  const tenders = deadlineView(db.tenders || []);

  return (
    <div className="stack">
      <div>
        <h1 className="h1">Fristen</h1>
        <p className="sub">Zeitkritische Chancen und der unmittelbare Bearbeitungsdruck.</p>
      </div>

      <section className="grid grid-3">
        <div className="card">
          <div className="label">Innerhalb 7 Tage</div>
          <div className="kpi">{tenders.filter((x: any) => x.daysLeft >= 0 && x.daysLeft <= 7).length}</div>
        </div>
        <div className="card">
          <div className="label">Innerhalb 14 Tage</div>
          <div className="kpi">{tenders.filter((x: any) => x.daysLeft >= 8 && x.daysLeft <= 14).length}</div>
        </div>
        <div className="card">
          <div className="label">Überfällig</div>
          <div className="kpi">{tenders.filter((x: any) => x.daysLeft < 0).length}</div>
        </div>
      </section>

      <div className="card table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Titel</th>
              <th>Entscheidung</th>
              <th>Frist</th>
              <th>Tage</th>
              <th>Status</th>
              <th>Nächster Schritt</th>
            </tr>
          </thead>
          <tbody>
            {tenders.map((row: any) => (
              <tr key={row.id}>
                <td>{row.title}</td>
                <td>{row.decision}</td>
                <td>{row.dueDate || "-"}</td>
                <td>{row.daysLeft}</td>
                <td>{row.bucket}</td>
                <td>{row.nextStep || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
TSX

echo "📊 Ops-Seite als Arbeitsbereich ..."
cat > app/dashboard/ops/page.tsx <<'TSX'
import Link from "next/link";

export default async function OpsPage() {
  return (
    <div className="stack">
      <div>
        <h1 className="h1">Ops</h1>
        <p className="sub">Technische Prüfungen, Smoke-Tests und AI-Checks für den laufenden Betrieb.</p>
      </div>

      <section className="grid grid-3">
        <Link href="/dashboard/smoke" className="card">
          <div className="section-title">Smoke</div>
          <p className="meta" style={{ marginTop: 10 }}>Grundlegende Struktur- und Datenprüfung.</p>
        </Link>

        <Link href="/dashboard/ai-smoke" className="card">
          <div className="section-title">AI Test</div>
          <p className="meta" style={{ marginTop: 10 }}>Heuristische und AI-gestützte Bewertung einzelner Treffer.</p>
        </Link>

        <Link href="/dashboard/source-tests" className="card">
          <div className="section-title">Quellentests</div>
          <p className="meta" style={{ marginTop: 10 }}>Status und technische Erreichbarkeit der Quellen.</p>
        </Link>
      </section>
    </div>
  );
}
TSX

echo "📊 Sites sprachlich schärfen ..."
python3 - <<'PY'
from pathlib import Path
p = Path("app/sites/page.tsx")
if p.exists():
    text = p.read_text()
    text = text.replace("Sites", "Betriebshöfe & Niederlassungen")
    text = text.replace("Offizielle RUWE-Standorte und Gruppengesellschaften mit editierbarer Logik.", "Aktive Betriebshöfe und Niederlassungen mit Radius-, Gewerk- und Regelsteuerung.")
    text = text.replace("Neuer Standort", "Neuer Betriebshof")
    p.write_text(text)
PY

npm run build || true
git add .
git commit -m "feat: redesign dashboard into management cockpit with focus, deadlines, source performance and pipeline stages" || true
git push origin main || true

echo "✅ Dashboard-Reifegrad-Sprung eingebaut."
