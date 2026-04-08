#!/bin/bash
set -e

cd ~/Arbeitsmappe/ruwe-bid-os

mkdir -p docs components lib data app/tenders app/pipeline app/agents app/zones app/buyers app/references app/config

cat > docs/README.md <<'DOC'
# RUWE Bid OS

Strategisches Steuerungssystem für Ausschreibungen, Regionen, Gewerke, Agenten und Forecast.

## Kernmodule
- Dashboard
- Tenders
- Pipeline
- Agents
- Zones
- Buyers
- References
- Config
DOC

cat > docs/OpenTasks.md <<'DOC'
# OpenTasks

## P0
- Dashboard in RUWE CI
- Seed-Daten
- Score-Logik
- Pipeline-Sicht
- Agentenübersicht

## P1
- Monitoring ohne RSS
- Referenzdatenbank
- Forecast
- Buyer Intelligence

## P2
- Persistenz
- Rollenmodell
- Angebotsbausteine
DOC

cat > docs/CURRENT_STATE.md <<'DOC'
# Current State

Minimal lauffähige Next.js-Basis ist vorhanden.
Nächster Stand: RUWE CI Dashboard + Navigationsstruktur + Seed-Daten + erste Steuerlogik.
DOC

cat > lib/models.ts <<'TS'
export type TenderPriority = "A" | "B" | "C";
export type TenderDecision = "Go" | "Prüfen" | "No-Go";

export interface Agent {
  id: string;
  name: string;
  focus: string;
  level: "Koordinator" | "Spezialist" | "Assistenz";
  winRate: number;
  pipelineValue: number;
}

export interface Tender {
  id: string;
  title: string;
  region: string;
  trade: string;
  buyer: string;
  recurring: boolean;
  estimatedValue: number;
  priority: TenderPriority;
  decision: TenderDecision;
}

export interface Zone {
  id: string;
  name: string;
  radiusKm: number;
  priorityTrades: string[];
}
TS

cat > lib/score.ts <<'TS'
import type { Tender } from "./models";

export function weightedPipeline(tenders: Tender[]) {
  return tenders
    .filter((t) => t.decision !== "No-Go")
    .reduce((sum, t) => {
      const factor = t.priority === "A" ? 0.7 : t.priority === "B" ? 0.4 : 0.15;
      return sum + t.estimatedValue * factor;
    }, 0);
}

export function goQuote(tenders: Tender[]) {
  if (!tenders.length) return 0;
  return tenders.filter((t) => t.decision === "Go").length / tenders.length;
}
TS

cat > data/seed.ts <<'TS'
import type { Agent, Tender, Zone } from "@/lib/models";

export const agents: Agent[] = [
  { id: "a1", name: "Agent 1", focus: "Facility Ost", level: "Koordinator", winRate: 0.41, pipelineValue: 4200000 },
  { id: "a2", name: "Agent 2", focus: "Sicherheit", level: "Koordinator", winRate: 0.37, pipelineValue: 3100000 },
  { id: "a3", name: "Agent 3", focus: "Kommunal", level: "Spezialist", winRate: 0.29, pipelineValue: 1800000 },
  { id: "a4", name: "Agent 4", focus: "Berlin selektiv", level: "Spezialist", winRate: 0.18, pipelineValue: 950000 },
  { id: "a5", name: "Agent 5", focus: "Assistenz", level: "Assistenz", winRate: 0.12, pipelineValue: 250000 },
  { id: "a6", name: "Agent 6", focus: "Assistenz", level: "Assistenz", winRate: 0.10, pipelineValue: 150000 }
];

export const zones: Zone[] = [
  { id: "z1", name: "Leipzig/Halle", radiusKm: 55, priorityTrades: ["Facility", "Sicherheit"] },
  { id: "z2", name: "Magdeburg/Salzlandkreis", radiusKm: 60, priorityTrades: ["Sicherheit", "Reinigung"] },
  { id: "z3", name: "Gera/Altenburg", radiusKm: 50, priorityTrades: ["Facility", "Hausmeister"] },
  { id: "z4", name: "Berlin selektiv", radiusKm: 35, priorityTrades: ["Sicherheit"] }
];

export const tenders: Tender[] = [
  { id: "t1", title: "Verwaltungsreinigung Leipzig", region: "Leipzig/Halle", trade: "Facility", buyer: "Stadt Leipzig", recurring: true, estimatedValue: 1800000, priority: "A", decision: "Go" },
  { id: "t2", title: "Sicherheitsdienst Salzlandkreis", region: "Magdeburg/Salzlandkreis", trade: "Sicherheit", buyer: "Jobcenter", recurring: true, estimatedValue: 2400000, priority: "A", decision: "Prüfen" },
  { id: "t3", title: "Schulreinigung Berlin", region: "Berlin selektiv", trade: "Reinigung", buyer: "Bezirk", recurring: true, estimatedValue: 900000, priority: "C", decision: "No-Go" },
  { id: "t4", title: "Hausmeisterdienst Gera", region: "Gera/Altenburg", trade: "Hausmeister", buyer: "Landratsamt", recurring: true, estimatedValue: 650000, priority: "B", decision: "Go" }
];
TS

cat > components/Nav.tsx <<'TSX'
import Link from "next/link";

const items = [
  ["/", "Dashboard"],
  ["/tenders", "Tenders"],
  ["/pipeline", "Pipeline"],
  ["/agents", "Agents"],
  ["/zones", "Zones"],
  ["/buyers", "Buyers"],
  ["/references", "References"],
  ["/config", "Config"],
];

export default function Nav() {
  return (
    <nav style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 24 }}>
      {items.map(([href, label]) => (
        <Link key={href} href={href} style={{ color: "white", textDecoration: "none", fontWeight: 700 }}>
          {label}
        </Link>
      ))}
    </nav>
  );
}
TSX

cat > app/globals.css <<'CSS'
:root {
  --ruwe-orange: #F18700;
  --ruwe-black: #0B0B0B;
  --ruwe-white: #FFFFFF;
  --ruwe-grey: #F3F4F6;
}

* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; font-family: Arial, Helvetica, sans-serif; background: var(--ruwe-grey); color: var(--ruwe-black); }
a { color: inherit; }
.shell { min-height: 100vh; }
.topbar { background: var(--ruwe-black); color: var(--ruwe-white); padding: 18px 24px; }
.brand { font-size: 28px; font-weight: 900; letter-spacing: 0.3px; }
.brand span { color: var(--ruwe-orange); }
.container { max-width: 1220px; margin: 0 auto; padding: 24px; }
.grid { display: grid; gap: 16px; }
.grid-4 { grid-template-columns: repeat(4, minmax(0,1fr)); }
.grid-2 { grid-template-columns: repeat(2, minmax(0,1fr)); }
.card { background: white; border-left: 6px solid var(--ruwe-orange); border-radius: 8px; padding: 18px; box-shadow: 0 2px 10px rgba(0,0,0,.05); }
.kpi { font-size: 32px; font-weight: 900; margin-top: 8px; }
.label { font-size: 12px; text-transform: uppercase; letter-spacing: .08em; color: #666; }
.table { width: 100%; border-collapse: collapse; }
.table th, .table td { text-align: left; padding: 12px; border-bottom: 1px solid #eee; }
.badge { display: inline-block; padding: 4px 8px; border-radius: 999px; font-size: 12px; font-weight: 700; }
.badge-a { background: #dcfce7; color: #166534; }
.badge-b { background: #fef3c7; color: #92400e; }
.badge-c { background: #fee2e2; color: #991b1b; }
.badge-go { background: #dcfce7; color: #166534; }
.badge-check { background: #e0f2fe; color: #075985; }
.badge-no { background: #fee2e2; color: #991b1b; }
@media (max-width: 900px) {
  .grid-4, .grid-2 { grid-template-columns: 1fr; }
}
CSS

cat > app/layout.tsx <<'TSX'
import "./globals.css";
import type { Metadata } from "next";
import Nav from "@/components/Nav";

export const metadata: Metadata = {
  title: "RUWE Bid OS",
  description: "Strategisches Steuerungssystem für Ausschreibungen",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body>
        <div className="shell">
          <header className="topbar">
            <div className="container">
              <div className="brand">RUWE <span>Bid OS</span></div>
              <div style={{ marginTop: 12 }}>
                <Nav />
              </div>
            </div>
          </header>
          <main className="container">{children}</main>
        </div>
      </body>
    </html>
  );
}
TSX

cat > app/page.tsx <<'TSX'
import { agents, tenders, zones } from "@/data/seed";
import { goQuote, weightedPipeline } from "@/lib/score";

export default function Page() {
  const weighted = weightedPipeline(tenders);
  const quote = goQuote(tenders);

  return (
    <div className="grid" style={{ gap: 24 }}>
      <section>
        <h1 style={{ fontSize: 42, margin: 0 }}>Vertriebssteuerung neu denken.</h1>
        <p style={{ maxWidth: 820, fontSize: 18 }}>
          Zonen-, radius- und gewerkebasiertes Bid Operating System für Pipeline, Agenten, Ausschreibungen,
          Forecast und spätere Automatisierung.
        </p>
      </section>

      <section className="grid grid-4">
        <div className="card"><div className="label">Ausschreibungen</div><div className="kpi">{tenders.length}</div></div>
        <div className="card"><div className="label">Zonen</div><div className="kpi">{zones.length}</div></div>
        <div className="card"><div className="label">Agents</div><div className="kpi">{agents.length}</div></div>
        <div className="card"><div className="label">Weighted Pipeline</div><div className="kpi">{Math.round(weighted/1000)}k €</div></div>
      </section>

      <section className="grid grid-2">
        <div className="card">
          <h2 style={{ marginTop: 0 }}>Tender Übersicht</h2>
          <table className="table">
            <thead>
              <tr><th>Titel</th><th>Region</th><th>Gewerk</th><th>Priorität</th><th>Entscheidung</th></tr>
            </thead>
            <tbody>
              {tenders.map((t) => (
                <tr key={t.id}>
                  <td>{t.title}</td>
                  <td>{t.region}</td>
                  <td>{t.trade}</td>
                  <td><span className={`badge badge-${t.priority.toLowerCase()}`}>{t.priority}</span></td>
                  <td>
                    <span className={`badge ${
                      t.decision === "Go" ? "badge-go" : t.decision === "Prüfen" ? "badge-check" : "badge-no"
                    }`}>{t.decision}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card">
          <h2 style={{ marginTop: 0 }}>Agenten & Steuerung</h2>
          <table className="table">
            <thead>
              <tr><th>Name</th><th>Fokus</th><th>Level</th><th>Win-Rate</th></tr>
            </thead>
            <tbody>
              {agents.map((a) => (
                <tr key={a.id}>
                  <td>{a.name}</td>
                  <td>{a.focus}</td>
                  <td>{a.level}</td>
                  <td>{Math.round(a.winRate * 100)}%</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ marginTop: 16 }}>
            <div className="label">Go-Quote</div>
            <div className="kpi">{Math.round(quote * 100)}%</div>
          </div>
        </div>
      </section>
    </div>
  );
}
TSX

for route in tenders pipeline agents zones buyers references config; do
cat > "app/$route/page.tsx" <<TSX
export default function Page() {
  return (
    <main>
      <h1>${route^}</h1>
      <p>Modul ${route} folgt im nächsten Slice.</p>
    </main>
  );
}
TSX
done

git add .
git commit -m "feat: bootstrap RUWE Bid OS dashboard, docs, seeds and navigation" || true
git push origin main
