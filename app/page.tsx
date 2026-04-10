import { buildDashboardWorkbench } from "@/lib/dashboardWorkbench";
import { buildDashboardHref, sanitizeInternalHref } from "@/lib/dashboardRoutes";
import { buildDashboardKpiCards } from "@/lib/dashboardKpiModel";
import { formatCurrencyCompact } from "@/lib/numberFormat";
import { readLiveRunState } from "@/lib/liveWorkbench";
import WorkbenchSidebarLeft from "@/components/dashboard/WorkbenchSidebarLeft";
import WorkbenchSidebarRight from "@/components/dashboard/WorkbenchSidebarRight";
import WorkbenchSearchBar from "@/components/dashboard/WorkbenchSearchBar";
import WorkbenchInsights from "@/components/dashboard/WorkbenchInsights";
import LiveActionBar from "@/components/dashboard/LiveActionBar";
import OwnerWorkloadWidget from "@/components/dashboard/OwnerWorkloadWidget";
import KpiMetricCard from "@/components/dashboard/KpiMetricCard";
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

  const kpiCards = buildDashboardKpiCards(data.kpis);

  const topNoBid = data.noBidRows[0];
  const longestRun = data.longRuns[0];
  const focusHit = data.focusHits[0];

  const highlightsRaw = (data.rightHighlights || []).filter(Boolean) as Array<{
    label?: string;
    value?: string;
    href?: string;
  }>;
  const highlights = highlightsRaw.map((item) => ({
    label: item.label || "Highlight",
    value: item.value || "-",
    href: sanitizeInternalHref(item.href, "/source-hits")
  }));
  const attention = [
    {
      label: "Offene Variablen",
      value: `${data.kpis.openVariables || 0} offen`,
      href: "/missing-variables?status=offen"
    },
    {
      label: "Fristen <= 7 Tage",
      value: `${data.kpis.due7 || 0} Fälle`,
      href: "/pipeline?window=7d"
    },
    {
      label: "Owner-Last",
      value: "Arbeitsverteilung prüfen",
      href: "/owner-workload"
    }
  ];
  const priorities = [
    topNoBid
      ? {
          title: "No-Bid-Blocker",
          detail: topNoBid.noBidReason || "Begründung prüfen",
          href: buildDashboardHref("/source-hits", {
            region: topNoBid.regionNormalized || topNoBid.region,
            trade: topNoBid.trade
          }),
          tone: "warning" as const
        }
      : {
          title: "No-Bid-Blocker",
          detail: "Keine Blocker im aktuellen Filter",
          href: "/source-hits",
          tone: "default" as const
        },
    longestRun
      ? {
          title: "Längste Laufzeit",
          detail: `${longestRun.durationMonths || 0} Monate`,
          href: buildDashboardHref("/source-hits", {
            region: longestRun.regionNormalized || longestRun.region,
            trade: longestRun.trade
          }),
          tone: "default" as const
        }
      : {
          title: "Längste Laufzeit",
          detail: "Keine Daten",
          href: "/source-hits",
          tone: "default" as const
        },
    focusHit
      ? {
          title: "Größtes Potenzial",
          detail: formatCurrencyCompact(focusHit.estimatedValue || 0),
          href: buildDashboardHref("/source-hits", {
            region: focusHit.regionNormalized || focusHit.region,
            trade: focusHit.trade,
            decision: "Bid"
          }),
          tone: "default" as const
        }
      : {
          title: "Größtes Potenzial",
          detail: "Keine validen Bid-Treffer",
          href: "/source-hits",
          tone: "default" as const
        }
  ];

  return (
    <div className="wb-shell">
      <section className="card wb-hero">
        <div>
          <h1 className="h1">
            <span className="headline-accent">Ausschreibungen</span> gezielt steuern.
          </h1>
          <p className="sub">
            Live-Steuerung für Geschäftsfelder, Regionen, Quellen, Direktlinks und KI-Bewertung.
          </p>
        </div>
        <div className="wb-hero-actions">
          <Link className="button" href="/opportunities?sort=fit">
            Opportunities
          </Link>
          <Link className="button-secondary" href="/missing-variables?status=offen">
            Offene Variablen
          </Link>
        </div>
      </section>

      <WorkbenchSidebarLeft filters={data.leftFilters} current={current} />

      <main className="wb-main">

        <LiveActionBar liveState={liveState} />

        <WorkbenchSearchBar
          search={current.search}
          trade={current.trade}
          region={current.region}
          decision={current.decision}
          sourceId={current.sourceId}
          filters={data.leftFilters}
        />

        <div className="kpi-grid">
          {kpiCards.map((kpi) => (
            <KpiMetricCard
              key={kpi.label}
              icon={kpi.icon}
              label={kpi.label}
              value={kpi.value}
              subtext={kpi.subtext}
              href={kpi.href}
              priority={kpi.priority}
            />
          ))}
        </div>

        <div className="grid grid-2">
          <div className="card">
            <div className="section-title">Geschäftsfeldniveau</div>
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
                  {data.tradeMatrix.length === 0 ? (
                    <tr>
                      <td colSpan={7}>Keine Treffer im aktuellen Filter.</td>
                    </tr>
                  ) : data.tradeMatrix.map((row: any) => (
                    <tr key={row.trade}>
                      <td>
                        <Link
                          className="linkish"
                          href={sanitizeInternalHref(buildDashboardHref("/", { ...current, trade: row?.trade || "Alle" }), "/")}
                        >
                          {row.trade}
                        </Link>
                      </td>
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
                  {data.regionTradeRows.length === 0 ? (
                    <tr>
                      <td colSpan={8}>Keine Potenziale im aktuellen Filter.</td>
                    </tr>
                  ) : data.regionTradeRows.map((row: any, i: number) => (
                    <tr key={`${row?.region || "na"}_${row?.trade || "na"}_${i}`}>
                      <td>
                        <Link
                          className="linkish"
                          href={sanitizeInternalHref(buildDashboardHref("/source-hits", { trade: row?.trade || "", region: row?.region || "" }), "/source-hits")}
                        >
                          {row.region}
                        </Link>
                      </td>
                      <td>
                        <Link
                          className="linkish"
                          href={sanitizeInternalHref(buildDashboardHref("/", { ...current, trade: row?.trade || "Alle" }), "/")}
                        >
                          {row.trade}
                        </Link>
                      </td>
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

        <OwnerWorkloadWidget />
      </main>

      <WorkbenchSidebarRight
        highlights={highlights}
        attention={attention}
        priorities={priorities}
      />
    </div>
  );
}
