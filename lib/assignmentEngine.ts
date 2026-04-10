import { toPlain } from "@/lib/serializers";

const COORDINATORS = [
  { id: "coord_berlin", name: "Koordinator Berlin", regions: ["Berlin"], trades: ["Reinigung", "Glasreinigung", "Hausmeister"] },
  { id: "coord_brandenburg", name: "Koordinator Brandenburg", regions: ["Brandenburg", "Potsdam / Stahnsdorf"], trades: ["Grünpflege", "Reinigung"] },
  { id: "coord_magdeburg", name: "Koordinator Magdeburg", regions: ["Magdeburg"], trades: ["Sicherheit", "Reinigung"] },
  { id: "coord_sachsen", name: "Koordinator Sachsen", regions: ["Schkeuditz / Leipzig", "Zeitz"], trades: ["Winterdienst", "Reinigung", "Hausmeister"] }
];

const ASSISTS = [
  { id: "assist_docs", name: "Assistenz Dokumente" },
  { id: "assist_calc", name: "Assistenz Kalkulation" }
];

export function assignOpportunity(opportunity: any) {
  const coordinator =
    COORDINATORS.find((x) => x.regions.includes(opportunity.region) && x.trades.includes(opportunity.trade)) ||
    COORDINATORS.find((x) => x.regions.includes(opportunity.region)) ||
    COORDINATORS[0];

  const support = opportunity.estimatedValue > 0 ? ASSISTS[1] : ASSISTS[0];

  return toPlain({
    ownerId: coordinator.id,
    ownerName: coordinator.name,
    supportOwnerId: support.id,
    supportOwnerName: support.name
  });
}
