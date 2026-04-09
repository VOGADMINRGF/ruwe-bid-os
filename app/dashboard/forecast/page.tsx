import { readStore } from "@/lib/storage";
import { forecastRecommendations } from "@/lib/forecastLogic";

export default async function ForecastPage() {
  const db = await readStore();
  const rows = forecastRecommendations(db.sourceHits || []);

  return (
    <div className="stack">
      <div>
        <h1 className="h1">Forecast</h1>
        <p className="sub">Welche Geschäftsfelder in welchen Regionen aktuell den stärksten Fokus verdienen.</p>
      </div>

      <div className="card">
        <div className="section-title">Management-Empfehlungen</div>
        <div className="stack" style={{ marginTop: 14 }}>
          {rows.slice(0, 5).map((row: any) => (
            <div key={`${row.trade}_${row.region}`} className="card soft">
              <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
                <div className="section-title" style={{ fontSize: 20 }}>
                  {row.trade} · {row.region}
                </div>
                <span className={row.recommendation === "Aktiv fokussieren" ? "badge badge-gut" : "badge badge-gemischt"}>
                  {row.recommendation}
                </span>
              </div>
              <p className="meta" style={{ marginTop: 12 }}>
                Treffer: {row.count} · Bid: {row.bids} · Prüfen: {row.reviews} · Volumen: {Math.round(row.volume / 1000)}k €
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="card table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Geschäftsfeld</th>
              <th>Region</th>
              <th>Treffer</th>
              <th>Volumen</th>
              <th>Bid</th>
              <th>Prüfen</th>
              <th>Empfehlung</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row: any) => (
              <tr key={`${row.trade}_${row.region}`}>
                <td>{row.trade}</td>
                <td>{row.region}</td>
                <td>{row.count}</td>
                <td>{Math.round(row.volume / 1000)}k €</td>
                <td>{row.bids}</td>
                <td>{row.reviews}</td>
                <td>{row.recommendation}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
