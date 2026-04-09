import { readStore } from "@/lib/storage";
import { forecastRecommendations } from "@/lib/forecastLogic";

export default async function ForecastPage() {
  const db = await readStore();
  const rows = forecastRecommendations(db.sourceHits || []);

  return (
    <div className="stack">
      <div>
        <h1 className="h1">Forecast</h1>
        <p className="sub">Welche Geschäftsfelder in welchen Regionen aktuell am attraktivsten wirken.</p>
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
