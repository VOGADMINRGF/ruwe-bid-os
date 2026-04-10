function isHttp(v: any) {
  return typeof v === "string" && /^https?:\/\//i.test(v);
}

function safeUrl(raw: string) {
  try {
    return new URL(raw);
  } catch {
    return null;
  }
}

function isHomepageOrSearch(url: URL) {
  const path = String(url.pathname || "").toLowerCase().replace(/\/+/g, "/");
  const full = `${url.hostname}${path}${url.search}`.toLowerCase();

  if (!path || path === "/" || path === "/index.html" || path === "/index.htm") return true;
  if (/(\/home|\/homepage|\/start|\/startseite|\/suche|\/search|\/results?)\/?$/.test(path)) return true;
  if (/[?&](q|query|search|suchbegriff)=/.test(url.search.toLowerCase())) return true;

  if (url.hostname.includes("ted.europa.eu")) {
    if (path === "/" || path === "/en/" || path === "/de/" || path === "/en/") return true;
    if (!/\/notice\//.test(path) && !/\/detail\//.test(path)) return true;
  }

  if (url.hostname.includes("service.bund.de")) {
    if (!/\/(ausschreibungen|importe|bekanntmachung|evergabe)/i.test(full)) return true;
  }

  return false;
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
      status: "missing",
      reason: "Kein valider Direktlink vorhanden."
    };
  }

  const url = candidates[0];
  const parsed = safeUrl(url);
  if (!parsed) {
    return {
      valid: false,
      url: null,
      status: "invalid_url",
      reason: "Linkformat ist ungültig."
    };
  }

  const badPatterns = [
    /homepage_node\.html/i,
    /\/home\/?$/i,
    /\/startseite/i,
    /\/index\.html?$/i
  ];

  const isBad = badPatterns.some((p) => p.test(url)) || isHomepageOrSearch(parsed);
  if (isBad) {
    return {
      valid: false,
      url: null,
      status: "homepage_or_search",
      reason: "Nur Start-/Suchseite erkannt, kein belastbarer Direktlink."
    };
  }

  return {
    valid: true,
    url,
    status: "direct_notice",
    reason: "Valider Direktlink erkannt."
  };
}
