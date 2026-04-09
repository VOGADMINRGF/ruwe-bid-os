export function prefilteredCount(tenders: any[]) {
  return tenders.filter((t) => t.prefilteredForBid).length;
}

export function classifyRadiusBand(distanceKm: number, rule: any) {
  if (distanceKm <= rule.primaryRadiusKm) return "primary";
  if (distanceKm <= rule.secondaryRadiusKm) return "secondary";
  if (distanceKm <= rule.tertiaryRadiusKm) return "tertiary";
  return "outside";
}

export function siteCoverage(sites: any[], rules: any[], tenders: any[]) {
  return sites.map((site) => {
    const ownRules = rules.filter((r) => r.siteId === site.id && r.enabled);
    const matching = tenders.filter((t) => t.matchedSiteId === site.id);

    return {
      site,
      rules: ownRules,
      tendersTotal: matching.length,
      goCount: matching.filter((t) => t.decision === "Go").length,
      reviewCount: matching.filter((t) => t.decision === "Prüfen" || t.manualReview === "zwingend").length,
      noGoCount: matching.filter((t) => t.decision === "No-Go").length
    };
  });
}

export function siteTradeOperationalRows(site: any, rules: any[], tenders: any[]) {
  const ownRules = rules.filter((r) => r.siteId === site.id && r.enabled);

  return ownRules.map((rule) => {
    const tradeTenders = tenders.filter((t) => t.trade === rule.trade && t.matchedSiteId === site.id);

    const primary = tradeTenders.filter((t) => classifyRadiusBand(t.distanceKm ?? 9999, rule) === "primary").length;
    const secondary = tradeTenders.filter((t) => classifyRadiusBand(t.distanceKm ?? 9999, rule) === "secondary").length;
    const tertiary = tradeTenders.filter((t) => classifyRadiusBand(t.distanceKm ?? 9999, rule) === "tertiary").length;

    const currentScope = tradeTenders.filter((t) => {
      const band = classifyRadiusBand(t.distanceKm ?? 9999, rule);
      return band === "primary" || band === "secondary";
    });

    const nextBand = tradeTenders.filter((t) => classifyRadiusBand(t.distanceKm ?? 9999, rule) === "tertiary");
    const nextBandManualCandidates = nextBand.filter((t) => t.decision !== "Go");

    return {
      rule,
      primary,
      secondary,
      tertiary,
      currentScopeCount: currentScope.length,
      nextBandCount: nextBand.length,
      nextBandManualCandidates: nextBandManualCandidates.length,
      monthlyCapacity: rule.monthlyCapacity,
      concurrentCapacity: rule.concurrentCapacity,
      capacityStatus:
        currentScope.length >= rule.monthlyCapacity
          ? "voll"
          : currentScope.length >= Math.max(1, Math.floor(rule.monthlyCapacity * 0.7))
            ? "eng"
            : "frei"
    };
  });
}
