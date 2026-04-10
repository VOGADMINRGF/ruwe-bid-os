#!/bin/bash
set -e

cd ~/Arbeitsmappe/ruwe-bid-os

echo "🚀 RUWE Bid OS — Normalization + Assignment + href Fix"

mkdir -p lib

cat > lib/regionNormalization.ts <<'TS'
import { toPlain } from "@/lib/serializers";

function txt(v: any) {
  return String(v || "").trim();
}

export function normalizeRegionLabel(input: any) {
  const s = txt(input).toLowerCase();

  if (!s) return "Sonstige";

  if (s.includes("berlin")) return "Berlin";
  if (s.includes("magdeburg")) return "Magdeburg";
  if (s.includes("schkeuditz") || s.includes("leipzig")) return "Leipzig / Schkeuditz";
  if (s.includes("zeitz")) return "Zeitz";
  if (s.includes("potsdam") || s.includes("stahnsdorf")) return "Potsdam / Stahnsdorf";
  if (s.includes("brandenburg")) return "Brandenburg";
  if (s.includes("halle") || s.includes("stendal") || s.includes("bismark") || s.includes("dessau") || s.includes("merseburg")) return "Sachsen-Anhalt";
  if (s.includes("jena") || s.includes("weimar") || s.includes("erfurt") || s.includes("ilm")) return "Thüringen";
  if (s.includes("online")) return "Online";

  return "Sonstige";
}

export function buildRegionCandidates(hit: any) {
  const parts = [
    hit?.region,
    hit?.city,
    hit?.postalCode,
    hit?.title,
    hit?.url
  ].filter(Boolean);

  return toPlain(parts.map((x) => String(x)));
}

export function normalizeRegionFromHit(hit: any) {
  const candidates = buildRegionCandidates(hit);
  for (const c of candidates) {
    const normalized = normalizeRegionLabel(c);
    if (normalized !== "Sonstige") return normalized;
  }
  return "Sonstige";
}
TS

cat > lib/tradeClassification.ts <<'TS'
import { toPlain } from "@/lib/serializers";

export const CORE_TRADES = [
  "Reinigung",
  "Glasreinigung",
  "Hausmeister",
  "Sicherheit",
  "Grünpflege",
  "Winterdienst",
  "Sonstiges"
];

function s(v: any) {
  return String(v || "").toLowerCase();
}

export function classifyTrade(hit: any) {
  const text = [
    hit?.trade,
    hit?.title,
    hit?.aiSummary,
    hit?.aiReason,
    hit?.aiPrimaryReason
  ].map(s).join(" ");

  if (text.includes("glas")) return "Glasreinigung";
  if (text.includes("winter") || text.includes("schnee") || text.includes("glätte")) return "Winterdienst";
  if (text.includes("hausmeister") || text.includes("hauswart") || text.includes("objektservice")) return "Hausmeister";
  if (text.includes("sicherheit") || text.includes("objektschutz") || text.includes("wachdienst") || text.includes("wachschutz")) return "Sicherheit";
  if (text.includes("grün") || text.includes("garten") || text.includes("landschaft") || text.includes("baumpflege")) return "Grünpflege";
  if (text.includes("reinigung") || text.includes("unterhaltsreinigung") || text.includes("gebäudereinigung")) return "Reinigung";

  return "Sonstiges";
}

export function detectCalcMode(hit: any) {
  const text = [
    hit?.title,
    hit?.aiSummary,
    hit?.aiReason,
    hit?.aiPrimaryReason
  ].map(s).join(" ");

  if (/\b(stunden|std|stundenlohn|stundensatz)\b/.test(text)) return "Stunden";
  if (/\b(qm|m²|quadratmeter|fläche)\b/.test(text)) return "Fläche";
  if (/\b(täglich|wöchentlich|monatlich|turnus|intervall)\b/.test(text)) return "Turnus";
  if (/\b(pauschal|pauschale|festpreis)\b/.test(text)) return "Pauschale";
  if (/\b(los|lose)\b/.test(text) && /\b(stunden|qm|fläche|turnus)\b/.test(text)) return "Mischmodell";

  return "unklar";
}

export function classifyOpportunity(hit: any) {
  return toPlain({
    trade: classifyTrade(hit),
    calcMode: detectCalcMode(hit)
  });
}
TS

cat > lib/assignmentEngine.ts <<'TS'
import { toPlain } from "@/lib/serializers";

const COORDINATORS = [
  {
    id: "coord_berlin",
    name: "Koordinator Berlin",
    regions: ["Berlin"],
    trades: ["Reinigung", "Glasreinigung", "Hausmeister"]
  },
  {
    id: "coord_brandenburg",
    name: "Koordinator Brandenburg",
    regions: ["Brandenburg", "Potsdam / Stahnsdorf"],
    trades: ["Reinigung", "Grünpflege"]
  },
  {
    id: "coord_magdeburg",
    name: "Koordinator Magdeburg",
    regions: ["Magdeburg", "Sachsen-Anhalt"],
    trades: ["Sicherheit", "Reinigung", "Hausmeister", "Grünpflege"]
  },
  {
    id: "coord_sachsen",
    name: "Koordinator Sachsen",
    regions: ["Leipzig / Schkeuditz", "Zeitz", "Thüringen"],
    trades: ["Winterdienst", "Reinigung", "Hausmeister", "Grünpflege"]
  }
];

const ASSISTS = [
  { id: "assist_docs", name: "Assistenz Dokumente" },
  { id: "assist_calc", name: "Assistenz Kalkulation" }
];

export function assignOpportunity(opportunity: any) {
  const exact =
    COORDINATORS.find((x) =>
      x.regions.includes(opportunity.region) && x.trades.includes(opportunity.trade)
    ) ||
    COORDINATORS.find((x) => x.regions.includes(opportunity.region)) ||
    COORDINATORS.find((x) => x.trades.includes(opportunity.trade)) ||
    COORDINATORS[0];

  const support =
    opportunity.calcMode === "unklar" || !opportunity.estimatedValue
      ? ASSISTS[0]
      : ASSISTS[1];

  return toPlain({
    ownerId: exact.id,
    ownerName: exact.name,
    supportOwnerId: support.id,
    supportOwnerName: support.name
  });
}
TS

cat > lib/opportunitySchema.ts <<'TS'
import { toPlain } from "@/lib/serializers";
import { normalizeRegionFromHit } from "@/lib/regionNormalization";
import { classifyOpportunity } from "@/lib/tradeClassification";

function n(v: any) {
  const x = Number(v || 0);
  return Number.isFinite(x) ? x : 0;
}

export function buildOpportunityFromHit(hit: any) {
  const classified = classifyOpportunity(hit);
  const region = normalizeRegionFromHit(hit);

  return toPlain({
    id: `opp_${String(hit.id || Math.random().toString(36).slice(2, 10))}`,
    sourceHitId: String(hit.id || ""),
    title: String(hit.title || ""),
    sourceId: String(hit.sourceId || ""),
    region,
    regionRaw: String(hit.region || hit.city || ""),
    trade: classified.trade,
    dueDate: hit.dueDate || null,
    durationMonths: n(hit.durationMonths),
    estimatedValue: n(hit.estimatedValue),
    directLinkValid: hit.directLinkValid === true,
    externalResolvedUrl: typeof hit.externalResolvedUrl === "string" ? hit.externalResolvedUrl : null,
    decision: String(hit.aiRecommendation || hit.aiDecision || "Unklar"),
    calcMode: classified.calcMode,
    complexity: "normal",
    hoursDerivable: classified.calcMode === "Stunden" || classified.calcMode === "Turnus",
    daysDerivable: false,
    areaDerivable: classified.calcMode === "Fläche",
    extractedSpecs: toPlain(hit.extractedSpecs || {}),
    understandingSignals: {},
    missingVariableCount: 0,
    ownerId: null,
    supportOwnerId: null,
    stage: "neu",
    nextQuestion: null,
    operationallyUsable: hit.operationallyUsable !== false
  });
}
TS

cat > lib/opportunityRebuild.ts <<'TS'
import { readStore, replaceCollection } from "@/lib/storage";
import { buildOpportunityFromHit } from "@/lib/opportunitySchema";
import { deriveMissingVariables } from "@/lib/missingVariables";
import { assignOpportunity } from "@/lib/assignmentEngine";
import { toPlain } from "@/lib/serializers";

export async function rebuildOpportunities() {
  const db = await readStore();
  const hits = Array.isArray(db.sourceHits) ? db.sourceHits : [];
  const parameterMemory = Array.isArray(db.parameterMemory) ? db.parameterMemory : [];

  const opportunities = [];
  const missingVariables = [];

  for (const hit of hits) {
    const opp = buildOpportunityFromHit(hit);
    const assignment = assignOpportunity(opp);
    const vars = deriveMissingVariables(opp, parameterMemory);

    opportunities.push({
      ...opp,
      ownerId: assignment.ownerId,
      supportOwnerId: assignment.supportOwnerId,
      missingVariableCount: vars.length,
      nextQuestion: vars[0]?.question || null,
      stage:
        opp.decision === "Bid" ? "qualifiziert" :
        vars.length > 0 ? "review" :
        "beobachten"
    });

    for (const v of vars) {
      missingVariables.push({
        ...v,
        ownerId: assignment.ownerId,
        supportOwnerId: assignment.supportOwnerId
      });
    }
  }

  await replaceCollection("opportunities", toPlain(opportunities));
  await replaceCollection("costGaps", toPlain(missingVariables));

  return toPlain({
    opportunities: opportunities.length,
    missingVariables: missingVariables.length
  });
}
TS

python3 - <<'PY'
from pathlib import Path
p = Path("lib/dashboardWorkbench.ts")
text = p.read_text()

if 'normalizeRegionFromHit' not in text:
    text = text.replace(
        'import { safeHref, toPlain } from "@/lib/serializers";',
        'import { safeHref, toPlain } from "@/lib/serializers";\nimport { normalizeRegionFromHit } from "@/lib/regionNormalization";\nimport { classifyTrade } from "@/lib/tradeClassification";'
    )

# normalize rows earlier/harder
text = text.replace(
"""  const hits = rawHits.map((hit: any) => {
    const decisionNormalized = normalizeDecision(hit);
    const regionNormalized = normalizeRegion(hit);

    return {
      ...hit,
      decisionNormalized,
      regionNormalized,
      noBidReason: decisionNormalized === "No-Bid" ? formatReason(hit) : "",
      href: safeHref(hit.externalResolvedUrl, resolveInternalHref({
        ...hit,
        decisionNormalized,
        regionNormalized
      }))
    };
  });
""",
"""  const hits = rawHits.map((hit: any) => {
    const decisionNormalized = normalizeDecision(hit);
    const regionNormalized = normalizeRegionFromHit(hit);
    const tradeNormalized = classifyTrade(hit);

    return {
      ...toPlain(hit),
      trade: tradeNormalized,
      decisionNormalized,
      regionNormalized,
      noBidReason: decisionNormalized === "No-Bid" ? formatReason(hit) : "",
      href: safeHref(
        hit?.externalResolvedUrl,
        resolveInternalHref({
          ...hit,
          trade: tradeNormalized,
          decisionNormalized,
          regionNormalized
        })
      )
    };
  });
"""
)

# ensure tradeMatrix href always exists
text = text.replace(
"""      href: safeHref(`/?trade=${encodeURIComponent(trade || "Alle")}`)
""",
"""      href: safeHref(`/?trade=${encodeURIComponent(trade || "Alle")}`, "/?trade=Alle")
"""
)

# ensure regionTradeRows fallback
text = text.replace(
"""      href: safeHref(`/source-hits?trade=${encodeURIComponent(trade)}&region=${encodeURIComponent(region)}`)
""",
"""      href: safeHref(`/source-hits?trade=${encodeURIComponent(trade || "")}&region=${encodeURIComponent(region || "")}`, "/source-hits")
"""
)

p.write_text(text)
print("dashboardWorkbench patched")
PY

python3 - <<'PY'
from pathlib import Path
p = Path("app/page.tsx")
text = p.read_text()

text = text.replace(
'key={`${row.region}_${row.trade}_${i}`}',
'key={`${row?.region || "na"}_${row?.trade || "na"}_${i}`}'
)

text = text.replace(
'href={String(row?.href || `/?trade=${encodeURIComponent(row?.trade || "Alle")}`)}',
'href={typeof row?.href === "string" && row.href ? row.href : `/?trade=${encodeURIComponent(row?.trade || "Alle")}`}'
)

text = text.replace(
'href={String(row?.href || `/source-hits?trade=${encodeURIComponent(row?.trade || "")}&region=${encodeURIComponent(row?.region || "")}`)}',
'href={typeof row?.href === "string" && row.href ? row.href : `/source-hits?trade=${encodeURIComponent(row?.trade || "")}&region=${encodeURIComponent(row?.region || "")}`}'
)

p.write_text(text)
print("app/page.tsx patched")
PY

python3 - <<'PY'
from pathlib import Path
p = Path("components/dashboard/WorkbenchSidebarRight.tsx")
text = p.read_text()
text = text.replace(
'href={String(item?.href || "/source-hits")}',
'href={typeof item?.href === "string" && item.href ? item.href : "/source-hits"}'
)
p.write_text(text)
print("sidebar right patched")
PY

python3 - <<'PY'
from pathlib import Path
p = Path("components/dashboard/WorkbenchInsights.tsx")
text = p.read_text()
text = text.replace(
'href={String(x.href || x.externalResolvedUrl || `/source-hits?trade=${encodeURIComponent(x.trade || "")}&region=${encodeURIComponent(x.regionNormalized || x.region || "")}`)}',
'href={typeof x?.href === "string" && x.href ? x.href : (typeof x?.externalResolvedUrl === "string" && x.externalResolvedUrl ? x.externalResolvedUrl : `/source-hits?trade=${encodeURIComponent(x.trade || "")}&region=${encodeURIComponent(x.regionNormalized || x.region || "")}`)}'
)
p.write_text(text)
print("insights patched")
PY

npm run build || true
git add lib/regionNormalization.ts lib/tradeClassification.ts lib/assignmentEngine.ts lib/opportunitySchema.ts lib/opportunityRebuild.ts lib/dashboardWorkbench.ts app/page.tsx components/dashboard/WorkbenchSidebarRight.tsx components/dashboard/WorkbenchInsights.tsx
git commit -m "fix: normalize regions and trades, improve owner routing, and harden dashboard links" || true
git push origin main || true

echo "✅ Normalization + Assignment Fix eingebaut."
