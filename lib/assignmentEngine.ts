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
    regions: ["Leipzig / Schkeuditz", "Zeitz", "Thüringen", "Online"],
    trades: ["Winterdienst", "Reinigung", "Hausmeister", "Grünpflege"]
  }
];

const ASSISTS = [
  { id: "assist_docs", name: "Assistenz Dokumente" },
  { id: "assist_calc", name: "Assistenz Kalkulation" }
];

function hashIndex(seed: string, max: number) {
  if (max <= 0) return 0;
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (h << 5) - h + seed.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h) % max;
}

export function assignOpportunity(opportunity: any) {
  const region = String(opportunity?.region || "");
  const trade = String(opportunity?.trade || "");
  const fallback = COORDINATORS[hashIndex(`${region}::${trade}`, COORDINATORS.length)];

  const exact =
    COORDINATORS.find((x) =>
      x.regions.includes(region) && x.trades.includes(trade)
    ) ||
    COORDINATORS.find((x) => x.regions.includes(region)) ||
    COORDINATORS.find((x) => x.trades.includes(trade)) ||
    fallback;

  const support =
    opportunity.calcMode === "unklar" || !opportunity.estimatedValue || opportunity.directLinkValid !== true
      ? ASSISTS[0]
      : ASSISTS[1];

  return toPlain({
    ownerId: exact.id,
    ownerName: exact.name,
    supportOwnerId: support.id,
    supportOwnerName: support.name
  });
}
