export function prefilteredCount(tenders: any[]) {
  return tenders.filter((t) => t.prefilteredForBid).length;
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
