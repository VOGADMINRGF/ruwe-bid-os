import { buildDashboardWorkbench } from "@/lib/dashboardWorkbench";
import { formatCurrencyCompact } from "@/lib/numberFormat";
import { readLiveRunState } from "@/lib/liveWorkbench";
import WorkbenchSidebarLeft from "@/components/dashboard/WorkbenchSidebarLeft";
import WorkbenchSidebarRight from "@/components/dashboard/WorkbenchSidebarRight";
import WorkbenchSearchBar from "@/components/dashboard/WorkbenchSearchBar";
import WorkbenchInsights from "@/components/dashboard/WorkbenchInsights";
import LiveActionBar from "@/components/dashboard/LiveActionBar";
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

  const [data, liveState] = await Promise.all([
    buildDashboardWorkbench({
      trade: q(current.trade),
      region: q(current.region),
      decision: q(current.decision),
      sourceId: q(current.sourceId),
      search: current.search
    }),
    readLiveRunState()
  ]);

  return (
    <div className="wb-shell">
      <WorkbenchSidebarLeft filters={data.leftFilters} current={current} />

      <main className="wb-main">
        <div>
          <h1 className="h1">
            <span className="headline-accent">Ausschreibungen</span> gezielt steuern.
          </h1>
          <p className="sub">
            Live-Steuerung für Geschäftsfelder, Regionen, Quellen, Direktlinks und KI-Bewertung.
          </p>
        </div>

        <LiveActionBar liveState={liveState} />

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
                      <td><Link className="linkish" href={row.href}>{row.trade}</Link></td>
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
                      <td><Link className="linkish" href={row.href}>{row.region}</Link></td>
                      <td><Link className="linkish" href={row.href}>{row.trade}</Link></td>
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
