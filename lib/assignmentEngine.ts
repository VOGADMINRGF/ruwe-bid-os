import { toPlain } from "@/lib/serializers";

const COORDINATORS = [
  {
    id: "coord_berlin",
    name: "Koordinator Berlin",
    regions: ["Berlin"],
    trades: ["Reinigung", "Glasreinigung", "Hausmeister"]
  },
  {
    id: "coord_brandenburg",
    name: "Koordinator Brandenburg",
    regions: ["Brandenburg", "Potsdam / Stahnsdorf"],
    trades: ["Reinigung", "Grünpflege"]
  },
  {
    id: "coord_magdeburg",
    name: "Koordinator Magdeburg",
    regions: ["Magdeburg", "Sachsen-Anhalt"],
    trades: ["Sicherheit", "Reinigung", "Hausmeister", "Grünpflege"]
  },
  {
    id: "coord_sachsen",
    name: "Koordinator Sachsen",
    regions: ["Leipzig / Schkeuditz", "Zeitz", "Thüringen"],
    trades: ["Winterdienst", "Reinigung", "Hausmeister", "Grünpflege"]
  }
];

const ASSISTS = [
  { id: "assist_docs", name: "Assistenz Dokumente" },
  { id: "assist_calc", name: "Assistenz Kalkulation" }
];

export function assignOpportunity(opportunity: any) {
  const exact =
    COORDINATORS.find((x) =>
      x.regions.includes(opportunity.region) && x.trades.includes(opportunity.trade)
    ) ||
    COORDINATORS.find((x) => x.regions.includes(opportunity.region)) ||
    COORDINATORS.find((x) => x.trades.includes(opportunity.trade)) ||
    COORDINATORS[0];

  const support =
    opportunity.calcMode === "unklar" || !opportunity.estimatedValue
      ? ASSISTS[0]
      : ASSISTS[1];

  return toPlain({
    ownerId: exact.id,
    ownerName: exact.name,
    supportOwnerId: support.id,
    supportOwnerName: support.name
  });
}
