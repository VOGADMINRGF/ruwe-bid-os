export interface Site {
  id: string;
  name: string;
  city: string;
  state: string;
  type: string;
  active: boolean;
  primaryRadiusKm: number;
  secondaryRadiusKm: number;
  ownerId?: string;
  notes?: string;
}

export interface ServiceArea {
  id: string;
  name: string;
  siteId: string;
  state: string;
  active: boolean;
}

export interface SiteTradeRule {
  id: string;
  siteId: string;
  trade: string;
  priority: "hoch" | "mittel" | "niedrig";
  primaryRadiusKm: number;
  secondaryRadiusKm: number;
  enabled: boolean;
  keywordsPositive: string[];
  keywordsNegative: string[];
  regionNotes?: string;
}
