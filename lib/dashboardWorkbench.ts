import { readStore } from "@/lib/storage";

const CORE_TRADES = [
  "Reinigung",
  "Glasreinigung",
  "Hausmeister",
  "Sicherheit",
  "Grünpflege",
  "Winterdienst"
];

function n(v: any) {
  const x = Number(v || 0);
  return Number.isFinite(x) ? x : 0;
}

function formatReason(hit: any) {
  if (!hit) return "unbekannt";
  if (!hit.directLinkValid) return "Direktlink unklar";
  if (!hit.trade || hit.trade === "Sonstiges") return "kein passendes Gewerk";
  if (n(hit.estimatedValue) <= 0) return "Volumen unklar";
  if (hit.operationallyUsable === false) return "operativ unklar";
  return "wirtschaftlich / fachlich prüfen";
}

export async function buildDashboardWorkbench(filters?: {
  trade?: string;
  region?: string;
  decision?: string;
  sourceId?: string;
  search?: string;
}) {
  const db = await readStore();
  const hits = Array.isArray(db.sourceHits) ? db.sourceHits : [];
  const opportunities = Array.isArray(db.opportunities) ? db.opportunities : [];
  const sites = Array.isArray(db.sites) ? db.sites : [];
  const rules = Array.isArray(db.siteTradeRules) ? db.siteTradeRules : [];

  let rows = hits.slice();

  if (filters?.trade && filters.trade !== "Alle") {
    rows = rows.filter((x: any) => String(x.trade || "") === filters.trade);
  }
  if (filters?.region && filters.region !== "Alle") {
    rows = rows.filter((x: any) => String(x.region || "") === filters.region);
  }
  if (filters?.decision && filters.decision !== "Alle") {
    rows = rows.filter((x: any) => String(x.aiRecommendation || x.aiDecision || "observed") === filters.decision);
  }
  if (filters?.sourceId && filters.sourceId !== "Alle") {
    rows = rows.filter((x: any) => String(x.sourceId || "") === filters.sourceId);
  }
  if (filters?.search) {
    const q = filters.search.toLowerCase();
    rows = rows.filter((x: any) =>
      String(x.title || "").toLowerCase().includes(q) ||
      String(x.region || "").toLowerCase().includes(q) ||
      String(x.trade || "").toLowerCase().includes(q)
    );
  }

  const availableRegions = [...new Set(
    rows.map((x: any) => x.region).filter(Boolean)
  )].sort();

  const availableSources = [...new Set(
    rows.map((x: any) => x.sourceId).filter(Boolean)
  )].sort();

  const tradeMatrix = CORE_TRADES.map((trade) => {
    const tradeHits = rows.filter((x: any) => x.trade === trade);
    const bid = tradeHits.filter((x: any) => x.aiRecommendation === "Bid").length;
    const review = tradeHits.filter((x: any) => x.aiRecommendation === "Prüfen" || x.aiRecommendation === "manual_review").length;
    const noBid = tradeHits.filter((x: any) =>
      x.aiRecommendation === "No-Bid" ||
      x.aiRecommendation === "No-Go" ||
      x.aiRecommendation === "observed"
    ).length;

    const byRegion = new Map<string, { region: string; value: number; count: number }>();
    for (const hit of tradeHits) {
      const region = hit.region || "Unbekannt";
      const prev = byRegion.get(region) || { region, value: 0, count: 0 };
      prev.value += n(hit.estimatedValue);
      prev.count += 1;
      byRegion.set(region, prev);
    }

    const strongestRegion = [...byRegion.values()].sort((a, b) => b.value - a.value || b.count - a.count)[0];

    return {
      trade,
      hits: tradeHits.length,
      volume: tradeHits.reduce((s: number, x: any) => s + n(x.estimatedValue), 0),
      bid,
      review,
      noBid,
      strongestRegion: strongestRegion?.region || "-"
    };
  }).filter((x) => x.hits > 0);

  const regionTrade = new Map<string, any>();
  for (const hit of rows) {
    const region = hit.region || "Unbekannt";
    const trade = hit.trade || "Sonstiges";
    const key = `${region}__${trade}`;
    const prev = regionTrade.get(key) || {
      region,
      trade,
      hits: 0,
      volume: 0,
      bid: 0,
      review: 0,
      noBid: 0,
      longestMonths: 0,
      noBidReason: ""
    };
    prev.hits += 1;
    prev.volume += n(hit.estimatedValue);
    prev.longestMonths = Math.max(prev.longestMonths, n(hit.durationMonths));
    if (hit.aiRecommendation === "Bid") prev.bid += 1;
    else if (hit.aiRecommendation === "Prüfen" || hit.aiRecommendation === "manual_review") prev.review += 1;
    else prev.noBid += 1;
    if (!prev.noBidReason && prev.noBid > 0) prev.noBidReason = formatReason(hit);
    regionTrade.set(key, prev);
  }

  const regionTradeRows = [...regionTrade.values()]
    .sort((a, b) => b.volume - a.volume || b.hits - a.hits)
    .slice(0, 24);

  const focusHits = rows
    .filter((x: any) => x.aiRecommendation === "Bid")
    .sort((a: any, b: any) => n(b.estimatedValue) - n(a.estimatedValue))
    .slice(0, 8);

  const longRuns = rows
    .filter((x: any) => n(x.durationMonths) > 0)
    .sort((a: any, b: any) => n(b.durationMonths) - n(a.durationMonths) || n(b.estimatedValue) - n(a.estimatedValue))
    .slice(0, 8);

  const noBidRows = rows
    .filter((x: any) => x.aiRecommendation !== "Bid")
    .map((x: any) => ({
      ...x,
      noBidReason: formatReason(x)
    }))
    .sort((a: any, b: any) => n(b.estimatedValue) - n(a.estimatedValue))
    .slice(0, 8);

  const deadlines = opportunities
    .filter((x: any) => x.dueDate)
    .map((x: any) => ({
      ...x,
      dueInDays: Math.floor((new Date(x.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    }))
    .sort((a: any, b: any) => a.dueInDays - b.dueInDays);

  const coverageGaps = rows
    .filter((x: any) => !x.siteMatchId && x.aiRecommendation !== "Bid")
    .slice(0, 8);

  const leftFilters = {
    trades: ["Alle", ...CORE_TRADES],
    regions: ["Alle", ...availableRegions],
    decisions: ["Alle", "Bid", "Prüfen", "No-Bid", "observed"],
    sources: ["Alle", ...availableSources]
  };

  const rightHighlights = [
    focusHits[0]
      ? {
          label: "Größtes Bid-Potenzial",
          href: `/source-hits?trade=${encodeURIComponent(focusHits[0].trade || "")}&region=${encodeURIComponent(focusHits[0].region || "")}`,
          value: focusHits[0].title || "-"
        }
      : null,
    longRuns[0]
      ? {
          label: "Längste Laufzeit",
          href: `/source-hits?trade=${encodeURIComponent(longRuns[0].trade || "")}&region=${encodeURIComponent(longRuns[0].region || "")}`,
          value: `${longRuns[0].title || "-"} · ${longRuns[0].durationMonths || 0} Mon.`
        }
      : null,
    noBidRows[0]
      ? {
          label: "Wichtigster No-Bid-Blocker",
          href: `/source-hits?region=${encodeURIComponent(noBidRows[0].region || "")}&trade=${encodeURIComponent(noBidRows[0].trade || "")}`,
          value: `${noBidRows[0].trade || "-"} · ${noBidRows[0].noBidReason}`
        }
      : null,
    coverageGaps[0]
      ? {
          label: "Größte Abdeckungslücke",
          href: `/source-hits?region=${encodeURIComponent(coverageGaps[0].region || "")}`,
          value: coverageGaps[0].title || "-"
        }
      : null
  ].filter(Boolean);

  return {
    kpis: {
      totalVolume: rows.reduce((s: number, x: any) => s + n(x.estimatedValue), 0),
      recommendedVolume: rows.filter((x: any) => x.aiRecommendation === "Bid").reduce((s: number, x: any) => s + n(x.estimatedValue), 0),
      noBidVolume: rows.filter((x: any) => x.aiRecommendation !== "Bid").reduce((s: number, x: any) => s + n(x.estimatedValue), 0),
      hitCount: rows.length,
      bidCount: rows.filter((x: any) => x.aiRecommendation === "Bid").length,
      reviewCount: rows.filter((x: any) => x.aiRecommendation === "Prüfen" || x.aiRecommendation === "manual_review").length,
      noBidCount: rows.filter((x: any) => x.aiRecommendation !== "Bid").length,
      siteCount: sites.length,
      ruleCount: rules.length
    },
    leftFilters,
    rightHighlights,
    tradeMatrix,
    regionTradeRows,
    focusHits,
    longRuns,
    noBidRows,
    coverageGaps,
    deadlines
  };
}
