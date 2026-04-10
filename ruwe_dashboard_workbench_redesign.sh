#!/bin/bash
set -e

cd ~/Arbeitsmappe/ruwe-bid-os

echo "🚀 RUWE Bid OS — Dashboard Workbench Redesign"

mkdir -p lib
mkdir -p components/dashboard
mkdir -p app/api/dashboard/workbench

echo "🧠 Dashboard analytics ..."
cat > lib/dashboardWorkbench.ts <<'TS'
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
TS

echo "🧩 Dashboard API ..."
cat > app/api/dashboard/workbench/route.ts <<'TS'
import { NextResponse } from "next/server";
import { buildDashboardWorkbench } from "@/lib/dashboardWorkbench";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const data = await buildDashboardWorkbench({
    trade: searchParams.get("trade") || undefined,
    region: searchParams.get("region") || undefined,
    decision: searchParams.get("decision") || undefined,
    sourceId: searchParams.get("sourceId") || undefined,
    search: searchParams.get("search") || undefined
  });
  return NextResponse.json(data);
}
TS

echo "🧩 Dashboard components ..."
cat > components/dashboard/WorkbenchSidebarLeft.tsx <<'TSX'
import Link from "next/link";

export default function WorkbenchSidebarLeft({
  filters,
  current
}: {
  filters: any;
  current: Record<string, string | undefined>;
}) {
  const makeHref = (patch: Record<string, string>) => {
    const params = new URLSearchParams();
    const merged = { ...current, ...patch };
    for (const [k, v] of Object.entries(merged)) {
      if (v) params.set(k, v);
    }
    return `/?${params.toString()}`;
  };

  return (
    <aside className="wb-sidebar">
      <div className="card">
        <div className="section-title">Filter</div>

        <div className="stack" style={{ gap: 10, marginTop: 14 }}>
          <div className="label">Geschäftsfelder</div>
          {filters.trades.map((x: string) => (
            <Link key={x} className="wb-filter-link" href={makeHref({ trade: x })}>{x}</Link>
          ))}

          <div className="label" style={{ marginTop: 12 }}>Regionen</div>
          {filters.regions.slice(0, 12).map((x: string) => (
            <Link key={x} className="wb-filter-link" href={makeHref({ region: x })}>{x}</Link>
          ))}

          <div className="label" style={{ marginTop: 12 }}>Entscheidung</div>
          {filters.decisions.map((x: string) => (
            <Link key={x} className="wb-filter-link" href={makeHref({ decision: x })}>{x}</Link>
          ))}
        </div>
      </div>
    </aside>
  );
}
TSX

cat > components/dashboard/WorkbenchSidebarRight.tsx <<'TSX'
import Link from "next/link";

export default function WorkbenchSidebarRight({ items }: { items: any[] }) {
  return (
    <aside className="wb-sidebar">
      <div className="card">
        <div className="section-title">Highlights</div>
        <div className="stack" style={{ gap: 12, marginTop: 14 }}>
          {items.map((item: any, i: number) => (
            <Link key={i} href={item.href} className="wb-highlight-link">
              <div className="label">{item.label}</div>
              <div>{item.value}</div>
            </Link>
          ))}
        </div>
      </div>
    </aside>
  );
}
TSX

cat > components/dashboard/WorkbenchSearchBar.tsx <<'TSX'
export default function WorkbenchSearchBar({
  search,
  trade,
  region,
  decision,
  sourceId,
  filters
}: {
  search?: string;
  trade?: string;
  region?: string;
  decision?: string;
  sourceId?: string;
  filters: any;
}) {
  return (
    <form method="GET" className="card" style={{ padding: 16 }}>
      <div className="grid grid-5">
        <input className="input" name="search" defaultValue={search || ""} placeholder="Suche Titel / Region / Gewerk" />
        <select className="select" name="trade" defaultValue={trade || "Alle"}>
          {filters.trades.map((x: string) => <option key={x} value={x}>{x}</option>)}
        </select>
        <select className="select" name="region" defaultValue={region || "Alle"}>
          {filters.regions.map((x: string) => <option key={x} value={x}>{x}</option>)}
        </select>
        <select className="select" name="decision" defaultValue={decision || "Alle"}>
          {filters.decisions.map((x: string) => <option key={x} value={x}>{x}</option>)}
        </select>
        <button className="button" type="submit">Filtern</button>
      </div>
    </form>
  );
}
TSX

echo "🧩 Dashboard page rewrite ..."
cat > app/page.tsx <<'TSX'
import Link from "next/link";
import { buildDashboardWorkbench } from "@/lib/dashboardWorkbench";
import { formatCurrencyCompact } from "@/lib/numberFormat";
import WorkbenchSidebarLeft from "@/components/dashboard/WorkbenchSidebarLeft";
import WorkbenchSidebarRight from "@/components/dashboard/WorkbenchSidebarRight";
import WorkbenchSearchBar from "@/components/dashboard/WorkbenchSearchBar";

function q(v: string | undefined) {
  return v && v !== "Alle" ? v : undefined;
}

export default async function DashboardPage({
  searchParams
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}) {
  const sp = searchParams ? await searchParams : {};
  const current = {
    trade: typeof sp.trade === "string" ? sp.trade : undefined,
    region: typeof sp.region === "string" ? sp.region : undefined,
    decision: typeof sp.decision === "string" ? sp.decision : undefined,
    sourceId: typeof sp.sourceId === "string" ? sp.sourceId : undefined,
    search: typeof sp.search === "string" ? sp.search : undefined
  };

  const data = await buildDashboardWorkbench({
    trade: q(current.trade),
    region: q(current.region),
    decision: q(current.decision),
    sourceId: q(current.sourceId),
    search: current.search
  });

  return (
    <div className="wb-layout">
      <WorkbenchSidebarLeft filters={data.leftFilters} current={current} />

      <main className="wb-main">
        <div>
          <h1 className="h1"><span className="headline-accent">Ausschreibungen</span> gezielt steuern.</h1>
          <p className="sub">Steuerzentrale nach Geschäftsfeld, Region, Entscheidung, Quelle, Frist und Potenzial.</p>
        </div>

        <WorkbenchSearchBar
          search={current.search}
          trade={current.trade}
          region={current.region}
          decision={current.decision}
          sourceId={current.sourceId}
          filters={data.leftFilters}
        />

        <div className="grid grid-6">
          <div className="card"><div className="label">Ausschreibungsvolumen</div><div className="kpi-compact">{formatCurrencyCompact(data.kpis.totalVolume)}</div><div className="metric-sub">{data.kpis.hitCount} Treffer</div></div>
          <div className="card"><div className="label">Empfohlen</div><div className="kpi-compact">{formatCurrencyCompact(data.kpis.recommendedVolume)}</div><div className="metric-sub">{data.kpis.bidCount} Bid</div></div>
          <div className="card"><div className="label">Prüfen</div><div className="kpi-compact">{data.kpis.reviewCount}</div><div className="metric-sub">manuelle Prüfung</div></div>
          <div className="card"><div className="label">No-Bid</div><div className="kpi-compact">{formatCurrencyCompact(data.kpis.noBidVolume)}</div><div className="metric-sub">{data.kpis.noBidCount} Fälle</div></div>
          <div className="card"><div className="label">Standorte</div><div className="kpi-compact">{data.kpis.siteCount}</div><div className="metric-sub">aktive Basis</div></div>
          <div className="card"><div className="label">Regeln</div><div className="kpi-compact">{data.kpis.ruleCount}</div><div className="metric-sub">Betriebslogik</div></div>
        </div>

        <div className="grid grid-2">
          <div className="card">
            <div className="section-title">Ausschreibungsniveau je Geschäftsfeld</div>
            <div className="table-wrap" style={{ marginTop: 14 }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Geschäftsfeld</th>
                    <th>Treffer</th>
                    <th>Volumen</th>
                    <th>Bid</th>
                    <th>Prüfen</th>
                    <th>No-Bid</th>
                    <th>stärkste Region</th>
                  </tr>
                </thead>
                <tbody>
                  {data.tradeMatrix.map((row: any) => (
                    <tr key={row.trade}>
                      <td><Link className="linkish" href={`/?trade=${encodeURIComponent(row.trade)}`}>{row.trade}</Link></td>
                      <td>{row.hits}</td>
                      <td>{formatCurrencyCompact(row.volume)}</td>
                      <td>{row.bid}</td>
                      <td>{row.review}</td>
                      <td>{row.noBid}</td>
                      <td>{row.strongestRegion}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="card">
            <div className="section-title">Region × Geschäftsfeld Potenziale</div>
            <div className="table-wrap" style={{ marginTop: 14 }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Region</th>
                    <th>Geschäftsfeld</th>
                    <th>Treffer</th>
                    <th>Volumen</th>
                    <th>Bid</th>
                    <th>Prüfen</th>
                    <th>No-Bid</th>
                    <th>Grund</th>
                  </tr>
                </thead>
                <tbody>
                  {data.regionTradeRows.map((row: any, i: number) => (
                    <tr key={`${row.region}_${row.trade}_${i}`}>
                      <td><Link className="linkish" href={`/?region=${encodeURIComponent(row.region)}`}>{row.region}</Link></td>
                      <td><Link className="linkish" href={`/?trade=${encodeURIComponent(row.trade)}`}>{row.trade}</Link></td>
                      <td>{row.hits}</td>
                      <td>{formatCurrencyCompact(row.volume)}</td>
                      <td>{row.bid}</td>
                      <td>{row.review}</td>
                      <td>{row.noBid}</td>
                      <td>{row.noBidReason || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="grid grid-3">
          <div className="card">
            <div className="section-title">Besonders zu fokussieren</div>
            <div className="table-wrap" style={{ marginTop: 14 }}>
              <table className="table">
                <thead><tr><th>Titel</th><th>Region</th><th>Volumen</th></tr></thead>
                <tbody>
                  {data.focusHits.map((x: any) => (
                    <tr key={x.id}>
                      <td><Link className="linkish" href={x.externalResolvedUrl || `/source-hits?trade=${encodeURIComponent(x.trade || "")}&region=${encodeURIComponent(x.region || "")}`}>{x.title}</Link></td>
                      <td>{x.region}</td>
                      <td>{formatCurrencyCompact(x.estimatedValue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="card">
            <div className="section-title">Höchste Laufzeiten</div>
            <div className="table-wrap" style={{ marginTop: 14 }}>
              <table className="table">
                <thead><tr><th>Titel</th><th>Region</th><th>Laufzeit</th></tr></thead>
                <tbody>
                  {data.longRuns.map((x: any) => (
                    <tr key={x.id}>
                      <td><Link className="linkish" href={x.externalResolvedUrl || `/source-hits?trade=${encodeURIComponent(x.trade || "")}`}>{x.title}</Link></td>
                      <td>{x.region}</td>
                      <td>{x.durationMonths || 0} Mon.</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="card">
            <div className="section-title">No-Bid / Blocker</div>
            <div className="table-wrap" style={{ marginTop: 14 }}>
              <table className="table">
                <thead><tr><th>Titel</th><th>Region</th><th>Grund</th></tr></thead>
                <tbody>
                  {data.noBidRows.map((x: any) => (
                    <tr key={x.id}>
                      <td><Link className="linkish" href={x.externalResolvedUrl || `/source-hits?region=${encodeURIComponent(x.region || "")}`}>{x.title}</Link></td>
                      <td>{x.region}</td>
                      <td>{x.noBidReason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      <WorkbenchSidebarRight items={data.rightHighlights} />
    </div>
  );
}
TSX

echo "🎨 Styles ..."
python3 - <<'PY'
from pathlib import Path
p = Path("app/globals.css")
text = p.read_text()

addon = """
.wb-layout {
  display: grid;
  grid-template-columns: 260px minmax(0, 1fr) 280px;
  gap: 20px;
  align-items: start;
}
.wb-main {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.wb-sidebar {
  position: sticky;
  top: 16px;
}
.wb-filter-link,
.wb-highlight-link {
  display: block;
  padding: 10px 12px;
  border: 1px solid var(--border);
  border-radius: 12px;
  text-decoration: none;
  color: inherit;
}
.wb-highlight-link:hover,
.wb-filter-link:hover {
  border-color: var(--accent);
}
@media (max-width: 1200px) {
  .wb-layout {
    grid-template-columns: 1fr;
  }
  .wb-sidebar {
    position: static;
  }
}
"""

if ".wb-layout" not in text:
    text += addon

p.write_text(text)
PY

npm run build || true
git add lib/dashboardWorkbench.ts app/api/dashboard/workbench/route.ts components/dashboard/WorkbenchSidebarLeft.tsx components/dashboard/WorkbenchSidebarRight.tsx components/dashboard/WorkbenchSearchBar.tsx app/page.tsx app/globals.css
git commit -m "feat: redesign dashboard into bid os workbench with sidebars, trade matrix and region potential view" || true
git push origin main || true

echo "✅ Dashboard Workbench Redesign eingebaut."
