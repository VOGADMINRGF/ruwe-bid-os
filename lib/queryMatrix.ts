import { readStore } from "@/lib/storage";

const DEFAULT_TRADES = [
  "Winterdienst",
  "Reinigung",
  "Glasreinigung",
  "Hausmeister",
  "Sicherheit",
  "Grünpflege"
];

export async function buildQueryMatrix() {
  const db = await readStore();
  const sites = Array.isArray(db.sites) ? db.sites : [];
  const globalKeywords = db.globalKeywords || { positive: [], negative: [] };
  const rules = Array.isArray(db.siteTradeRules) ? db.siteTradeRules : [];

  const regions = Array.from(
    new Set(
      sites
        .map((s: any) => s.city || s.region || s.state)
        .filter(Boolean)
    )
  );

  const trades = Array.from(
    new Set([
      ...DEFAULT_TRADES,
      ...rules.map((r: any) => r.trade).filter(Boolean),
      ...(globalKeywords.positive || [])
    ])
  ).filter(Boolean);

  const queries: { sourceId: string; trade: string; region: string; query: string }[] = [];

  const searchableSources = ["src_service_bund", "src_ted", "src_berlin", "src_dtvp"];

  for (const sourceId of searchableSources) {
    for (const trade of trades) {
      queries.push({
        sourceId,
        trade,
        region: "",
        query: trade
      });

      for (const region of regions) {
        queries.push({
          sourceId,
          trade,
          region,
          query: `${trade} ${region}`
        });
      }
    }
  }

  return queries;
}
