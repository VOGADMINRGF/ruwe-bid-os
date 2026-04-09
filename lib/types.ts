export type TenderPriority = "A" | "B" | "C";
export type TenderDecision = "Go" | "Prüfen" | "No-Go";
export type TenderStatus = "neu" | "vorqualifiziert" | "manuelle_pruefung" | "go" | "no_go" | "beobachten";

export interface Site {
  id: string;
  name: string;
  city: string;
  state: string;
  active: boolean;
  primaryRadiusKm: number;
  secondaryRadiusKm: number;
  ownerId?: string;
  notes?: string;
}

export interface SiteTradeRule {
  id: string;
  siteId: string;
  trade: string;
  priority: "hoch" | "mittel" | "niedrig";
  primaryRadiusKm: number;
  secondaryRadiusKm: number;
  enabled: boolean;
}

export interface Zone {
  id: string;
  name: string;
  homeBase: string;
  state: string;
  primaryRadiusKm: number;
  secondaryRadiusKm: number;
  priorityTrades: string[];
  supportedTrades: string[];
}

export interface Buyer {
  id: string;
  name: string;
  type: string;
  strategic: boolean;
}

export interface Agent {
  id: string;
  name: string;
  focus: string;
  level: string;
  region: string;
  winRate: number;
  pipelineValue: number;
}

export interface Tender {
  id: string;
  title: string;
  region: string;
  trade: string;
  buyerId: string;
  zoneId: string;
  ownerId?: string;
  priority: TenderPriority;
  decision: TenderDecision;
  status: TenderStatus;
  manualReview: "zwingend" | "optional" | "nein";
  fitSummary: "stark" | "mittel" | "schwach";
  riskLevel: "niedrig" | "mittel" | "hoch";
  estimatedValue: number;
  dueDate?: string;
  sourceType?: string;
  ingestedAt?: string;
  distanceKm?: number;
}

export interface PipelineEntry {
  id: string;
  title: string;
  stage: string;
  value: number;
  tenderId?: string;
}

export interface ReferenceItem {
  id: string;
  title: string;
  description: string;
  trade: string;
  region: string;
  value: number;
}
