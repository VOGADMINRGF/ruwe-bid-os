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

const CORE_REGIONS = [
  "berlin",
  "magdeburg",
  "potsdam / stahnsdorf",
  "leipzig / schkeuditz",
  "zeitz",
  "brandenburg",
  "sachsen-anhalt",
  "thüringen",
  "online"
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
  const region = text(hit?.regionNormalized || hit?.region || "");
  const inCoreRegion = CORE_REGIONS.some((x) => region.includes(x));
  const signals: string[] = [];
  let score = 0;

  if (!validLink) {
    return {
      allowed: false,
      reason: "Kein valider Direktlink",
      score: 0,
      signals: ["Direktlink fehlt"]
    };
  }
  score += 30;
  signals.push("Direktlink valide");

  if (!usable) {
    return {
      allowed: false,
      reason: "Nicht operativ nutzbar",
      score: Math.max(0, score - 10),
      signals
    };
  }
  score += 10;

  if (!relevant) {
    return {
      allowed: false,
      reason: "Nicht RUWE-relevant",
      score: Math.max(0, score - 15),
      signals
    };
  }
  score += 15;
  signals.push("RUWE-relevantes Gewerk");
  if (inCoreRegion) {
    score += 15;
    signals.push("Kernregion");
  }
  if (matched && distance <= 80) {
    score += 20;
    signals.push("Standortmatch");
  }
  if (volume >= 100000) {
    score += 8;
    signals.push("Relevantes Volumen");
  }
  if (duration >= 12) {
    score += 6;
    signals.push("Längere Laufzeit");
  }

  if (matched && distance <= 80) {
    return {
      allowed: true,
      reason: "Standort- und Geschäftsfeldfit gegeben",
      score: Math.min(100, score),
      signals
    };
  }

  if (inCoreRegion && relevant) {
    return {
      allowed: true,
      reason: "Relevanter Kernraum-Fall, fachliche AI-Prüfung sinnvoll",
      score: Math.min(100, score),
      signals
    };
  }

  if (volume >= 100000 || duration >= 12) {
    return {
      allowed: true,
      reason: "Strategisch relevanter Grenzfall",
      score: Math.min(100, score),
      signals
    };
  }

  return {
    allowed: false,
    reason: "Zu schwacher Fit für AI-Lauf",
    score: Math.max(0, score - 20),
    signals
  };
}

export function selectAiCandidates(hits: any[], maxCount = 12) {
  return hits
    .map((hit) => ({ hit, gate: isAiCandidate(hit) }))
    .filter((x) => x.gate.allowed)
    .sort((a, b) => n(b.gate?.score) - n(a.gate?.score))
    .slice(0, maxCount);
}
