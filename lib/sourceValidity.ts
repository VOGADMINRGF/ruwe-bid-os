import { strictDirectLink } from "@/lib/strictLinkValidation";

function isHttp(v: any) {
  return typeof v === "string" && /^https?:\/\//i.test(v);
}

export function classifyExternalLink(hit: any, registry: any[] = []) {
  const strict = strictDirectLink(hit);
  if (strict.valid) {
    return {
      url: strict.url,
      linkStatus: "direct_notice",
      linkLabel: "Originalquelle öffnen",
      isReliable: true
    };
  }

  const directCandidates = [
    hit?.noticeUrl,
    hit?.externalUrl,
    hit?.detailUrl,
    hit?.url,
    hit?.link
  ].filter(isHttp);

  const source = registry.find((s: any) => s.id === hit?.sourceId);
  const searchCandidates = [
    source?.searchUrl,
    source?.baseUrl,
    source?.homepage,
    source?.url
  ].filter(isHttp);

  if (searchCandidates.length) {
    return {
      url: searchCandidates[0],
      linkStatus: "source_home_only",
      linkLabel: strict.reason || "Quellenportal öffnen",
      isReliable: false
    };
  }

  return {
    url: null,
    linkStatus: "missing",
    linkLabel: "Kein valider Direktlink",
    isReliable: false
  };
}

export function sourceDataQuality(hit: any) {
  const reasons: string[] = [];

  if (!hit?.region) reasons.push("Region fehlt");
  if (!hit?.trade || hit?.trade === "Sonstiges") reasons.push("Geschäftsfeld unscharf");
  if (!hit?.estimatedValue || Number(hit?.estimatedValue) <= 0) reasons.push("Volumen fehlt");
  if (!hit?.matchedSiteId) reasons.push("Kein Standortmatch");
  if (!hit?.distanceKm && hit?.distanceKm !== 0) reasons.push("Distanz fehlt");

  return {
    quality: reasons.length === 0 ? "hoch" : reasons.length <= 2 ? "mittel" : "niedrig",
    reasons
  };
}
