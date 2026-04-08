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
