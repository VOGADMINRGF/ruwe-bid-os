export function resolveBestExternalUrl(hit: any, registry?: any[]) {
  const candidates = [
    hit?.noticeUrl,
    hit?.externalUrl,
    hit?.detailUrl,
    hit?.url,
    hit?.link,
    hit?.guidUrl,
    hit?.guid
  ].filter(Boolean);

  const firstHttp = candidates.find((x) => typeof x === "string" && /^https?:\/\//i.test(x));
  if (firstHttp) return firstHttp;

  const source = (registry || []).find((s: any) => s.id === hit?.sourceId);
  const sourceCandidates = [
    source?.searchUrl,
    source?.baseUrl,
    source?.homepage,
    source?.url
  ].filter(Boolean);

  const sourceHttp = sourceCandidates.find((x) => typeof x === "string" && /^https?:\/\//i.test(x));
  return sourceHttp || null;
}

export function hasRealExternalDetailUrl(hit: any) {
  const candidates = [
    hit?.noticeUrl,
    hit?.externalUrl,
    hit?.detailUrl,
    hit?.url,
    hit?.link
  ].filter(Boolean);

  return candidates.some((x) => typeof x === "string" && /^https?:\/\//i.test(x));
}
