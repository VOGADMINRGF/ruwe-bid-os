#!/bin/bash
set -e

echo "🚀 Upgrade RUWE Bid OS gestartet..."

cd ~/Arbeitsmappe/ruwe-bid-os

# ===============================
# 1. Erweiterte Datenmodelle
# ===============================
cat > lib/models.ts <<'TS'
export type TenderPriority = "A" | "B" | "C";
export type TenderDecision = "Go" | "Prüfen" | "No-Go";
export type TenderStatus =
  | "neu"
  | "vorqualifiziert"
  | "manuelle_pruefung"
  | "go"
  | "no_go"
  | "beobachten";

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
  status: TenderStatus;
  manualReview: "zwingend" | "optional" | "nein";
  owner?: string;
  dueDate?: string;
  riskLevel: "niedrig" | "mittel" | "hoch";
  fitSummary: "stark" | "mittel" | "schwach";
}

export interface Zone {
  id: string;
  name: string;
  radiusKm: number;
  priorityTrades: string[];
}
TS

# ===============================
# 2. Erweiterte Scoring-Logik
# ===============================
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

export function dashboardKPIs(tenders: Tender[]) {
  const neu = tenders.filter((t) => t.status === "neu").length;
  const manual = tenders.filter((t) => t.manualReview === "zwingend").length;
  const goCandidates = tenders.filter((t) => t.decision === "Go").length;
  const offene = tenders.filter((t) => t.decision === "Prüfen").length;
  const ueberfaellig = tenders.filter(
    (t) => t.dueDate && new Date(t.dueDate) < new Date()
  ).length;

  return { neu, manual, goCandidates, offene, ueberfaellig };
}

export function overallAssessment(tenders: Tender[]): "gut" | "gemischt" | "kritisch" {
  const total = tenders.length;
  if (total === 0) return "gemischt";

  const strong = tenders.filter((t) => t.priority === "A" || t.priority === "B").length;
  const go = tenders.filter((t) => t.decision === "Go").length;
  const overdue = tenders.filter(
    (t) => t.dueDate && new Date(t.dueDate) < new Date()
  ).length;

  if (strong / total > 0.5 && go / total > 0.3 && overdue === 0) return "gut";
  if (overdue > 2 || go / total < 0.2) return "kritisch";
  return "gemischt";
}
TS

# ===============================
# 3. Seed-Daten erweitern
# ===============================
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
  {
    id: "t1",
    title: "Verwaltungsreinigung Leipzig",
    region: "Leipzig/Halle",
    trade: "Facility",
    buyer: "Stadt Leipzig",
    recurring: true,
    estimatedValue: 1800000,
    priority: "A",
    decision: "Go",
    status: "go",
    manualReview: "nein",
    owner: "Agent 1",
    dueDate: "2026-05-10",
    riskLevel: "niedrig",
    fitSummary: "stark"
  },
  {
    id: "t2",
    title: "Sicherheitsdienst Salzlandkreis",
    region: "Magdeburg/Salzlandkreis",
    trade: "Sicherheit",
    buyer: "Jobcenter",
    recurring: true,
    estimatedValue: 2400000,
    priority: "A",
    decision: "Prüfen",
    status: "manuelle_pruefung",
    manualReview: "zwingend",
    owner: "Agent 2",
    dueDate: "2026-04-20",
    riskLevel: "mittel",
    fitSummary: "stark"
  },
  {
    id: "t3",
    title: "Schulreinigung Berlin",
    region: "Berlin selektiv",
    trade: "Reinigung",
    buyer: "Bezirk",
    recurring: true,
    estimatedValue: 900000,
    priority: "C",
    decision: "No-Go",
    status: "no_go",
    manualReview: "nein",
    riskLevel: "hoch",
    fitSummary: "schwach"
  },
  {
    id: "t4",
    title: "Hausmeisterdienst Gera",
    region: "Gera/Altenburg",
    trade: "Hausmeister",
    buyer: "Landratsamt",
    recurring: true,
    estimatedValue: 650000,
    priority: "B",
    decision: "Go",
    status: "go",
    manualReview: "optional",
    owner: "Agent 3",
    dueDate: "2026-04-25",
    riskLevel: "niedrig",
    fitSummary: "mittel"
  }
];
TS

# ===============================
# 4. Dashboard erweitern
# ===============================
cat > app/page.tsx <<'TSX'
import { agents, tenders, zones } from "@/data/seed";
import { goQuote, weightedPipeline, dashboardKPIs, overallAssessment } from "@/lib/score";

export default function Page() {
  const weighted = weightedPipeline(tenders);
  const quote = goQuote(tenders);
  const kpis = dashboardKPIs(tenders);
  const assessment = overallAssessment(tenders);

  const assessmentColor =
    assessment === "gut" ? "#16a34a" : assessment === "kritisch" ? "#dc2626" : "#f59e0b";

  return (
    <div className="grid" style={{ gap: 24 }}>
      <section>
        <h1 style={{ fontSize: 42, margin: 0 }}>Vertriebssteuerung neu denken.</h1>
        <p style={{ maxWidth: 820, fontSize: 18 }}>
          Zonen-, radius- und gewerkebasiertes Bid Operating System für Pipeline, Agenten,
          Ausschreibungen, Forecast und Automatisierung.
        </p>
      </section>

      {/* KPI CARDS */}
      <section className="grid grid-4">
        <div className="card"><div className="label">Neu eingegangen</div><div className="kpi">{kpis.neu}</div></div>
        <div className="card"><div className="label">Manuell prüfen</div><div className="kpi">{kpis.manual}</div></div>
        <div className="card"><div className="label">Go-Kandidaten</div><div className="kpi">{kpis.goCandidates}</div></div>
        <div className="card"><div className="label">Offene Entscheidungen</div><div className="kpi">{kpis.offene}</div></div>
        <div className="card"><div className="label">Überfällig</div><div className="kpi">{kpis.ueberfaellig}</div></div>
        <div className="card">
          <div className="label">Gesamtlage</div>
          <div className="kpi" style={{ color: assessmentColor, textTransform: "uppercase" }}>
            {assessment}
          </div>
        </div>
      </section>

      {/* MANAGEMENT QUEUE */}
      <section className="card">
        <h2 style={{ marginTop: 0 }}>Management-Warteschlange</h2>
        <table className="table">
          <thead>
            <tr>
              <th>Titel</th>
              <th>Region</th>
              <th>Priorität</th>
              <th>Manuelle Prüfung</th>
              <th>Verantwortlich</th>
              <th>Frist</th>
            </tr>
          </thead>
          <tbody>
            {tenders
              .filter((t) => t.manualReview !== "nein" || t.decision === "Prüfen")
              .map((t) => (
                <tr key={t.id}>
                  <td>{t.title}</td>
                  <td>{t.region}</td>
                  <td>{t.priority}</td>
                  <td>{t.manualReview}</td>
                  <td>{t.owner || "-"}</td>
                  <td>{t.dueDate || "-"}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </section>

      {/* EXISTING TABLES */}
      <section className="grid grid-2">
        <div className="card">
          <h2 style={{ marginTop: 0 }}>Tender Übersicht</h2>
          <table className="table">
            <thead>
              <tr>
                <th>Titel</th>
                <th>Region</th>
                <th>Gewerk</th>
                <th>Priorität</th>
                <th>Entscheidung</th>
              </tr>
            </thead>
            <tbody>
              {tenders.map((t) => (
                <tr key={t.id}>
                  <td>{t.title}</td>
                  <td>{t.region}</td>
                  <td>{t.trade}</td>
                  <td>{t.priority}</td>
                  <td>{t.decision}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card">
          <h2 style={{ marginTop: 0 }}>Agenten & Steuerung</h2>
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Fokus</th>
                <th>Level</th>
                <th>Win-Rate</th>
              </tr>
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
            <div className="label">Weighted Pipeline</div>
            <div className="kpi">{Math.round(weighted / 1000)}k €</div>
            <div className="label" style={{ marginTop: 8 }}>Go-Quote</div>
            <div className="kpi">{Math.round(quote * 100)}%</div>
          </div>
        </div>
      </section>
    </div>
  );
}
TSX

# ===============================
# 5. Commit & Push
# ===============================
git add .
git commit -m "feat: advanced dashboard with management KPIs, queue and assessment logic" || true
git push origin main

echo "✅ Upgrade abgeschlossen und nach GitHub gepusht!"
echo "🌐 Starte lokal mit: npm run dev"
echo "🚀 Vercel Deployment erfolgt automatisch."
