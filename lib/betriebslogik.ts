import { readStore } from "@/lib/storage";

export async function listBetriebslogikCards() {
  const db = await readStore();
  const sites = Array.isArray(db.sites) ? db.sites : [];
  const rules = Array.isArray(db.siteTradeRules) ? db.siteTradeRules : [];

  return rules.map((rule: any) => {
    const site = sites.find((s: any) => s.id === rule.siteId);

    return {
      id: rule.id,
      siteId: rule.siteId,
      siteName: site?.name || rule.siteId || "Standort",
      city: site?.city || "",
      trade: rule.trade || "",
      priority: rule.priority || "mittel",
      enabled: rule.enabled !== false,
      primaryRadiusKm: rule.primaryRadiusKm ?? 0,
      secondaryRadiusKm: rule.secondaryRadiusKm ?? 0,
      tertiaryRadiusKm: rule.tertiaryRadiusKm ?? 0,
      monthlyCapacity: rule.monthlyCapacity ?? 0,
      concurrentCapacity: rule.concurrentCapacity ?? 0,
      keywordsPositive: Array.isArray(rule.keywordsPositive) ? rule.keywordsPositive : [],
      keywordsNegative: Array.isArray(rule.keywordsNegative) ? rule.keywordsNegative : [],
      regionNotes: rule.regionNotes || "",
      generatedQueries: buildSuggestedQueries(rule.trade, site)
    };
  });
}

function buildSuggestedQueries(trade: string, site: any) {
  const city = site?.city || "";
  const state = site?.state || "";
  const out = new Set<string>();

  if (trade) out.add(trade);
  if (trade && city) out.add(`${trade} ${city}`);
  if (trade && state) out.add(`${trade} ${state}`);

  const map: Record<string, string[]> = {
    Winterdienst: ["Schneeräumung", "Glättebeseitigung"],
    Reinigung: ["Unterhaltsreinigung", "Gebäudereinigung"],
    Glasreinigung: ["Fensterreinigung"],
    Hausmeister: ["Objektservice", "Hauswart"],
    Sicherheit: ["Objektschutz", "Wachdienst"],
    Grünpflege: ["Gartenpflege", "Landschaftspflege"]
  };

  for (const synonym of map[trade] || []) {
    out.add(synonym);
    if (city) out.add(`${synonym} ${city}`);
  }

  return [...out];
}
