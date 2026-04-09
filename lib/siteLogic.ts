import { Site, SiteTradeRule, Tender } from "./types";

export function getMatchingSiteRule(
  tender: Tender,
  sites: Site[],
  rules: SiteTradeRule[]
) {
  const enabledRules = rules.filter((r) => r.enabled && r.trade === tender.trade);
  const candidates = enabledRules
    .map((rule) => {
      const site = sites.find((s) => s.id === rule.siteId);
      if (!site) return null;

      const distance = tender.distanceKm ?? 9999;
      const radiusType =
        distance <= rule.primaryRadiusKm
          ? "primary"
          : distance <= rule.secondaryRadiusKm
            ? "secondary"
            : "outside";

      return {
        site,
        rule,
        distanceKm: distance,
        radiusType
      };
    })
    .filter(Boolean) as Array<{
      site: Site;
      rule: SiteTradeRule;
      distanceKm: number;
      radiusType: "primary" | "secondary" | "outside";
    }>;

  candidates.sort((a, b) => a.distanceKm - b.distanceKm);

  return candidates[0] ?? null;
}

export function preselectedForBid(
  tender: Tender,
  sites: Site[],
  rules: SiteTradeRule[]
) {
  const match = getMatchingSiteRule(tender, sites, rules);
  if (!match) return false;
  if (tender.decision === "No-Go") return false;
  if (match.radiusType === "outside") return false;
  return true;
}

export function coverageBySite(
  tenders: Tender[],
  sites: Site[],
  rules: SiteTradeRule[]
) {
  return sites.map((site) => {
    const siteRules = rules.filter((r) => r.siteId === site.id && r.enabled);
    const matching = tenders.filter((t) =>
      siteRules.some((r) => r.trade === t.trade && (t.distanceKm ?? 9999) <= r.secondaryRadiusKm)
    );

    return {
      site,
      tendersTotal: matching.length,
      goCount: matching.filter((t) => t.decision === "Go").length,
      reviewCount: matching.filter((t) => t.decision === "Prüfen" || t.manualReview === "zwingend").length,
      noGoCount: matching.filter((t) => t.decision === "No-Go").length,
      trades: siteRules.map((r) => `${r.trade} (${r.primaryRadiusKm}/${r.secondaryRadiusKm} km)`)
    };
  });
}
