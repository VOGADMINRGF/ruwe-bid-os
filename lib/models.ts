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
