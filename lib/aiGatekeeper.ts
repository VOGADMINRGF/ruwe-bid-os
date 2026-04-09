function n(v: any) {
  const x = Number(v || 0);
  return Number.isFinite(x) ? x : 0;
}

function text(v: any) {
  return String(v || "").toLowerCase();
}

const RUWE_TRADES = [
  "reinigung",
  "glasreinigung",
  "hausmeister",
  "sicherheit",
  "winterdienst",
  "grünpflege",
  "gruenpflege",
  "garten",
  "landschaft"
];

export function isRuweRelevant(hit: any) {
  const t = text(hit?.trade);
  const title = text(hit?.title);
  const desc = text(hit?.description);
  return RUWE_TRADES.some((k) => t.includes(k) || title.includes(k) || desc.includes(k));
}

export function isAiCandidate(hit: any) {
  const validLink = hit?.directLinkValid === true;
  const usable = hit?.operationallyUsable !== false;
  const relevant = isRuweRelevant(hit);
  const matched = !!hit?.matchedSiteId;
  const distance = n(hit?.distanceKm || 999);
  const volume = n(hit?.estimatedValue);
  const duration = n(hit?.durationMonths);

  if (!validLink) {
    return {
      allowed: false,
      reason: "Kein valider Direktlink"
    };
  }

  if (!usable) {
    return {
      allowed: false,
      reason: "Nicht operativ nutzbar"
    };
  }

  if (!relevant) {
    return {
      allowed: false,
      reason: "Nicht RUWE-relevant"
    };
  }

  if (matched && distance <= 60) {
    return {
      allowed: true,
      reason: "Standort- und Geschäftsfeldfit gegeben"
    };
  }

  if (volume >= 250000 || duration >= 24) {
    return {
      allowed: true,
      reason: "Strategisch relevanter Grenzfall"
    };
  }

  return {
    allowed: false,
    reason: "Zu schwacher Fit für AI-Lauf"
  };
}

export function selectAiCandidates(hits: any[], maxCount = 12) {
  return hits
    .map((hit) => ({ hit, gate: isAiCandidate(hit) }))
    .filter((x) => x.gate.allowed)
    .slice(0, maxCount);
}
