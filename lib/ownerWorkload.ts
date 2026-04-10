import { readStore } from "@/lib/storage";
import { toPlain } from "@/lib/serializers";

const OWNER_LABELS: Record<string, string> = {
  coord_berlin: "Koordinator Berlin",
  coord_brandenburg: "Koordinator Brandenburg",
  coord_magdeburg: "Koordinator Magdeburg",
  coord_sachsen: "Koordinator Sachsen",
  assist_docs: "Assistenz Dokumente",
  assist_calc: "Assistenz Kalkulation"
};

export async function buildOwnerWorkload() {
  const db = await readStore();
  const opps = Array.isArray(db.opportunities) ? db.opportunities : [];
  const vars = Array.isArray(db.costGaps) ? db.costGaps : [];

  const owners = new Set<string>();
  for (const x of opps) {
    if (x.ownerId) owners.add(x.ownerId);
    if (x.supportOwnerId) owners.add(x.supportOwnerId);
  }
  for (const x of vars) {
    if (x.ownerId) owners.add(x.ownerId);
    if (x.supportOwnerId) owners.add(x.supportOwnerId);
  }

  const rows = [...owners].map((ownerId) => {
    const ownedOpps = opps.filter((x: any) => x.ownerId === ownerId);
    const supportOpps = opps.filter((x: any) => x.supportOwnerId === ownerId);
    const ownedVars = vars.filter((x: any) => x.ownerId === ownerId && x.status !== "beantwortet");
    const supportVars = vars.filter((x: any) => x.supportOwnerId === ownerId && x.status !== "beantwortet");

    return {
      ownerId,
      ownerName: OWNER_LABELS[ownerId] || ownerId,
      opportunitiesOwned: ownedOpps.length,
      opportunitiesSupport: supportOpps.length,
      missingVariablesOwned: ownedVars.length,
      missingVariablesSupport: supportVars.length,
      totalLoad: ownedOpps.length + supportOpps.length + ownedVars.length + supportVars.length
    };
  }).sort((a, b) => b.totalLoad - a.totalLoad);

  return toPlain(rows);
}
