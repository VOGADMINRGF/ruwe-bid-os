#!/bin/bash
set -e

cd ~/Arbeitsmappe/ruwe-bid-os

echo "🚀 RUWE Bid OS — Dashboard Layout Fix"

mkdir -p components/dashboard

echo "🧩 Compact sidebar left ..."
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
      if (v && v !== "Alle") params.set(k, v);
    }
    return `/?${params.toString()}`;
  };

  return (
    <aside className="wb-sidebar">
      <div className="card">
        <div className="section-title">Schnellfilter</div>

        <div className="stack" style={{ gap: 8, marginTop: 14 }}>
          <div className="label">Geschäftsfelder</div>
          {filters.trades.slice(0, 7).map((x: string) => (
            <Link key={x} className="wb-filter-link" href={makeHref({ trade: x })}>{x}</Link>
          ))}

          <div className="label" style={{ marginTop: 12 }}>Entscheidung</div>
          {["Bid", "Prüfen", "No-Bid"].map((x: string) => (
            <Link key={x} className="wb-filter-link" href={makeHref({ decision: x })}>{x}</Link>
          ))}

          <div className="label" style={{ marginTop: 12 }}>Top-Regionen</div>
          {filters.regions.slice(0, 6).map((x: string) => (
            <Link key={x} className="wb-filter-link" href={makeHref({ region: x })}>{x}</Link>
          ))}
        </div>
      </div>
    </aside>
  );
}
TSX

echo "🧩 Bottom insights tabs ..."
cat > components/dashboard/WorkbenchInsights.tsx <<'TSX'
"use client";

import { useState } from "react";
import Link from "next/link";

export default function WorkbenchInsights({
  focusHits,
  longRuns,
  noBidRows
}: {
  focusHits: any[];
  longRuns: any[];
  noBidRows: any[];
}) {
  const [tab, setTab] = useState<"focus" | "runs" | "nobid">("focus");

  const rows =
    tab === "focus" ? focusHits :
    tab === "runs" ? longRuns :
    noBidRows;

  return (
    <div className="card">
      <div className="toolbar" style={{ marginBottom: 14 }}>
        <button className={tab === "focus" ? "button" : "button-secondary"} onClick={() => setTab("focus")} type="button">
          Fokus
        </button>
        <button className={tab === "runs" ? "button" : "button-secondary"} onClick={() => setTab("runs")} type="button">
          Laufzeiten
        </button>
        <button className={tab === "nobid" ? "button" : "button-secondary"} onClick={() => setTab("nobid")} type="button">
          No-Bid
        </button>
      </div>

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Titel</th>
              <th>Region</th>
              <th>{tab === "runs" ? "Laufzeit" : tab === "nobid" ? "Grund" : "Volumen"}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((x: any) => (
              <tr key={x.id}>
                <td>
                  <Link
                    className="linkish"
                    href={x.externalResolvedUrl || `/source-hits?trade=${encodeURIComponent(x.trade || "")}&region=${encodeURIComponent(x.region || "")}`}
                  >
                    {x.title}
                  </Link>
                </td>
                <td>{x.region || "-"}</td>
                <td>
                  {tab === "runs"
                    ? `${x.durationMonths || 0} Mon.`
                    : tab === "nobid"
                    ? x.noBidReason || "-"
                    : x.estimatedValue || 0}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
TSX

echo "🧩 Rewrite dashboard page layout ..."
cat > app/page.tsx <<'TSX'
import { buildDashboardWorkbench } from "@/lib/dashboardWorkbench";
import { formatCurrencyCompact } from "@/lib/numberFormat";
import WorkbenchSidebarLeft from "@/components/dashboard/WorkbenchSidebarLeft";
import WorkbenchSidebarRight from "@/components/dashboard/WorkbenchSidebarRight";
import WorkbenchSearchBar from "@/components/dashboard/WorkbenchSearchBar";
import WorkbenchInsights from "@/components/dashboard/WorkbenchInsights";
import Link from "next/link";

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
    <div className="wb-shell">
      <WorkbenchSidebarLeft filters={data.leftFilters} current={current} />

      <main className="wb-main">
        <div>
          <h1 className="h1">
            <span className="headline-accent">Ausschreibungen</span> gezielt steuern.
          </h1>
          <p className="sub">
            Steuerzentrale nach Geschäftsfeld, Region, Entscheidung, Quelle, Frist und Potenzial.
          </p>
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
            <div className="table-wrap" style={{ marginTop: 14, maxHeight: 520 }}>
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

        <WorkbenchInsights
          focusHits={data.focusHits}
          longRuns={data.longRuns}
          noBidRows={data.noBidRows}
        />
      </main>

      <WorkbenchSidebarRight items={data.rightHighlights} />
    </div>
  );
}
TSX

echo "🎨 CSS layout fix ..."
python3 - <<'PY'
from pathlib import Path
p = Path("app/globals.css")
text = p.read_text()

append = """
.wb-shell {
  width: 100%;
  max-width: 1720px;
  margin: 0 auto;
  padding: 20px 24px 40px;
  display: grid;
  grid-template-columns: 220px minmax(0, 1fr) 240px;
  gap: 20px;
  align-items: start;
}
.wb-main {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.wb-sidebar {
  min-width: 0;
  position: sticky;
  top: 16px;
}
.table-wrap {
  overflow: auto;
}
.kpi-compact {
  font-size: 2rem;
  line-height: 1.05;
  font-weight: 800;
}
@media (max-width: 1400px) {
  .wb-shell {
    grid-template-columns: 200px minmax(0, 1fr) 220px;
  }
}
@media (max-width: 1200px) {
  .wb-shell {
    grid-template-columns: 1fr;
  }
  .wb-sidebar {
    position: static;
  }
}
"""

if ".wb-shell" not in text:
  text += append

p.write_text(text)
PY

npm run build || true
git add app/page.tsx app/globals.css components/dashboard/WorkbenchSidebarLeft.tsx components/dashboard/WorkbenchInsights.tsx
git commit -m "fix: widen dashboard workbench and compact sidebars for usable layout" || true
git push origin main || true

echo "✅ Dashboard Layout Fix eingebaut."
