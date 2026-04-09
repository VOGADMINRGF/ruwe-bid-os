function isHttp(v: any) {
  return typeof v === "string" && /^https?:\/\//i.test(v);
}

export function strictDirectLink(hit: any) {
  const candidates = [
    hit?.noticeUrl,
    hit?.externalUrl,
    hit?.detailUrl,
    hit?.url,
    hit?.link
  ].filter(isHttp);

  if (!candidates.length) {
    return {
      valid: false,
      url: null,
      reason: "Kein valider Direktlink vorhanden."
    };
  }

  const url = candidates[0];

  const badPatterns = [
    /homepage_node\.html/i,
    /\/home\/?$/i,
    /\/startseite/i,
    /\/index\.html?$/i
  ];

  const isBad = badPatterns.some((p) => p.test(url));
  if (isBad) {
    return {
      valid: false,
      url: null,
      reason: "Nur Startseiten-Link vorhanden, kein belastbarer Ausschreibungslink."
    };
  }

  return {
    valid: true,
    url,
    reason: "Valider Direktlink erkannt."
  };
}
