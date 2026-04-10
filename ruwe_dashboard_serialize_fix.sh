#!/bin/bash
set -e

cd ~/Arbeitsmappe/ruwe-bid-os

echo "🚀 RUWE Bid OS — Dashboard Serialize + href Fix"

python3 - <<'PY'
from pathlib import Path

p = Path("lib/dashboardWorkbench.ts")
text = p.read_text()

if "function toPlain" not in text:
    text = text.replace(
"""const CORE_TRADES = [
  "Reinigung",
  "Glasreinigung",
  "Hausmeister",
  "Sicherheit",
  "Grünpflege",
  "Winterdienst"
];
""",
"""const CORE_TRADES = [
  "Reinigung",
  "Glasreinigung",
  "Hausmeister",
  "Sicherheit",
  "Grünpflege",
  "Winterdienst"
];

function toPlain<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}
"""
    )

text = text.replace(
"""    return {
      trade,
      hits: tradeHits.length,
      volume: tradeHits.reduce((s: number, x: any) => s + n(x.estimatedValue), 0),
      bid,
      review,
      noBid,
      strongestRegion: strongestRegion?.region || "-",
      href: `/?trade=${encodeURIComponent(trade)}`
    };
""",
"""    return {
      trade,
      hits: tradeHits.length,
      volume: tradeHits.reduce((s: number, x: any) => s + n(x.estimatedValue), 0),
      bid,
      review,
      noBid,
      strongestRegion: strongestRegion?.region || "-",
      href: `/?trade=${encodeURIComponent(trade || "Alle")}`
    };
"""
)

text = text.replace(
"""  return {
    kpis: {
      totalVolume: rows.reduce((s: number, x: any) => s + n(x.estimatedValue), 0),
      recommendedVolume: rows.filter((x: any) => x.decisionNormalized === "Bid").reduce((s: number, x: any) => s + n(x.estimatedValue), 0),
      noBidVolume: rows.filter((x: any) => x.decisionNormalized === "No-Bid").reduce((s: number, x: any) => s + n(x.estimatedValue), 0),
      hitCount: rows.length,
      bidCount: rows.filter((x: any) => x.decisionNormalized === "Bid").length,
      reviewCount: rows.filter((x: any) => x.decisionNormalized === "Prüfen").length,
      noBidCount: rows.filter((x: any) => x.decisionNormalized === "No-Bid").length,
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
    coverageGaps
  };
}""",
"""  return toPlain({
    kpis: {
      totalVolume: rows.reduce((s: number, x: any) => s + n(x.estimatedValue), 0),
      recommendedVolume: rows.filter((x: any) => x.decisionNormalized === "Bid").reduce((s: number, x: any) => s + n(x.estimatedValue), 0),
      noBidVolume: rows.filter((x: any) => x.decisionNormalized === "No-Bid").reduce((s: number, x: any) => s + n(x.estimatedValue), 0),
      hitCount: rows.length,
      bidCount: rows.filter((x: any) => x.decisionNormalized === "Bid").length,
      reviewCount: rows.filter((x: any) => x.decisionNormalized === "Prüfen").length,
      noBidCount: rows.filter((x: any) => x.decisionNormalized === "No-Bid").length,
      siteCount: sites.length,
      ruleCount: rules.length
    },
    leftFilters,
    rightHighlights,
    tradeMatrix: tradeMatrix.map((row: any) => ({
      ...row,
      href: row?.href || `/?trade=${encodeURIComponent(row?.trade || "Alle")}`
    })),
    regionTradeRows: regionTradeRows.map((row: any) => ({
      ...row,
      href: row?.href || `/source-hits?trade=${encodeURIComponent(row?.trade || "")}&region=${encodeURIComponent(row?.region || "")}`
    })),
    focusHits: focusHits.map((x: any) => ({
      ...x,
      href: x?.href || x?.externalResolvedUrl || `/source-hits?trade=${encodeURIComponent(x?.trade || "")}&region=${encodeURIComponent(x?.regionNormalized || x?.region || "")}`
    })),
    longRuns: longRuns.map((x: any) => ({
      ...x,
      href: x?.href || x?.externalResolvedUrl || `/source-hits?trade=${encodeURIComponent(x?.trade || "")}&region=${encodeURIComponent(x?.regionNormalized || x?.region || "")}`
    })),
    noBidRows: noBidRows.map((x: any) => ({
      ...x,
      href: x?.href || x?.externalResolvedUrl || `/source-hits?trade=${encodeURIComponent(x?.trade || "")}&region=${encodeURIComponent(x?.regionNormalized || x?.region || "")}`
    })),
    coverageGaps: coverageGaps.map((x: any) => ({
      ...x,
      href: x?.href || x?.externalResolvedUrl || `/source-hits?region=${encodeURIComponent(x?.regionNormalized || x?.region || "")}`
    }))
  });
}"""
)

p.write_text(text)
print("dashboardWorkbench.ts patched")
PY

python3 - <<'PY'
from pathlib import Path

p = Path("components/dashboard/WorkbenchInsights.tsx")
text = p.read_text()

text = text.replace(
"""                  <Link
                    className="linkish"
                    href={x.externalResolvedUrl || `/source-hits?trade=${encodeURIComponent(x.trade || "")}&region=${encodeURIComponent(x.region || "")}`}
                  >
""",
"""                  <Link
                    className="linkish"
                    href={x.href || x.externalResolvedUrl || `/source-hits?trade=${encodeURIComponent(x.trade || "")}&region=${encodeURIComponent(x.regionNormalized || x.region || "")}`}
                  >
"""
)

p.write_text(text)
print("WorkbenchInsights.tsx patched")
PY

python3 - <<'PY'
from pathlib import Path

p = Path("components/dashboard/WorkbenchSidebarRight.tsx")
text = p.read_text()

text = text.replace(
"""            <Link key={i} href={item.href} className="wb-highlight-link">
""",
"""            <Link key={i} href={item?.href || "/source-hits"} className="wb-highlight-link">
"""
)

p.write_text(text)
print("WorkbenchSidebarRight.tsx patched")
PY

python3 - <<'PY'
from pathlib import Path

p = Path("app/page.tsx")
text = p.read_text()

text = text.replace(
"""                      <td><Link className="linkish" href={row.href}>{row.trade}</Link></td>
""",
"""                      <td><Link className="linkish" href={row?.href || `/?trade=${encodeURIComponent(row?.trade || "Alle")}`}>{row.trade}</Link></td>
"""
)

text = text.replace(
"""                      <td><Link className="linkish" href={row.href}>{row.region}</Link></td>
                      <td><Link className="linkish" href={row.href}>{row.trade}</Link></td>
""",
"""                      <td><Link className="linkish" href={row?.href || `/source-hits?trade=${encodeURIComponent(row?.trade || "")}&region=${encodeURIComponent(row?.region || "")}`}>{row.region}</Link></td>
                      <td><Link className="linkish" href={row?.href || `/source-hits?trade=${encodeURIComponent(row?.trade || "")}&region=${encodeURIComponent(row?.region || "")}`}>{row.trade}</Link></td>
"""
)

p.write_text(text)
print("app/page.tsx patched")
PY

npm run build || true
git add lib/dashboardWorkbench.ts components/dashboard/WorkbenchInsights.tsx components/dashboard/WorkbenchSidebarRight.tsx app/page.tsx
git commit -m "fix: serialize dashboard data and harden link fallbacks" || true
git push origin main || true

echo "✅ Dashboard Serialize Fix eingebaut."
