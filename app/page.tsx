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
