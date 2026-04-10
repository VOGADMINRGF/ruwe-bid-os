import { buildForecastSummary } from "@/lib/forecastSummary";
import { formatCurrencyCompact } from "@/lib/numberFormat";

export default async function ForecastPage() {
  const summary = await buildForecastSummary();

  return (
    <div className="stack">
      <div>
        <h1 className="h1"><span className="headline-accent">Forecast</span> & Fokusfelder</h1>
        <p className="sub">Wo sich künftige Vertriebs- und Ausschreibungsbearbeitung am stärksten lohnt.</p>
      </div>

      <div className="grid grid-2">
        <div className="card">
          <div className="label">Opportunity-Volumen</div>
          <div className="kpi-compact">{formatCurrencyCompact(summary.totalOpportunityValue)}</div>
          <div className="metric-sub">{summary.totalOpportunities} Opportunities</div>
        </div>

        <div className="card">
          <div className="label">Aktualisiert</div>
          <div className="kpi-compact">{summary.createdAt.slice(0, 10)}</div>
          <div className="metric-sub">Forecast-Snapshot</div>
        </div>
      </div>

      <div className="card">
        <div className="section-title">Region × Gewerk Hotspots</div>
        <div className="table-wrap" style={{ marginTop: 14 }}>
          <table className="table">
            <thead>
              <tr>
                <th>Region</th>
                <th>Gewerk</th>
                <th>Treffer</th>
                <th>Volumen</th>
                <th>Bid</th>
                <th>Prüfen</th>
              </tr>
            </thead>
            <tbody>
              {summary.hotspots.map((row: any) => (
                <tr key={`${row.region}_${row.trade}`}>
                  <td>{row.region}</td>
                  <td>{row.trade}</td>
                  <td>{row.hitCount}</td>
                  <td>{formatCurrencyCompact(row.value)}</td>
                  <td>{row.bidCount}</td>
                  <td>{row.reviewCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
