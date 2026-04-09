import { readStore } from "@/lib/storage";
import { formatCurrencyCompact } from "@/lib/numberFormat";

export default async function CostModelsPage() {
  const db = await readStore();
  const models = db.costModels || [];
  const gaps = db.costGaps || [];

  return (
    <div className="stack">
      <div>
        <h1 className="h1"><span className="headline-accent">Kostenmodelle</span> & Parameterlücken</h1>
        <p className="sub">Regionale Kalkulationsbasis für Volumenschätzung und spätere Ausschreibungen.</p>
      </div>

      <div className="grid grid-2">
        <div className="card">
          <div className="section-title">Kostenmodelle</div>
          <div className="table-wrap" style={{ marginTop: 14 }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Region</th>
                  <th>Geschäftsfeld</th>
                  <th>Einheit</th>
                  <th>Standard</th>
                  <th>Spanne</th>
                </tr>
              </thead>
              <tbody>
                {models.map((m: any) => (
                  <tr key={m.id}>
                    <td>{m.region}</td>
                    <td>{m.trade}</td>
                    <td>{m.unit}</td>
                    <td>{formatCurrencyCompact(m.defaultRate)}</td>
                    <td>{formatCurrencyCompact(m.minRate)} – {formatCurrencyCompact(m.maxRate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <div className="section-title">Offene Parameterlücken</div>
          <div className="table-wrap" style={{ marginTop: 14 }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Region</th>
                  <th>Geschäftsfeld</th>
                  <th>Fehlt</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {gaps.map((g: any) => (
                  <tr key={g.id}>
                    <td>{g.region}</td>
                    <td>{g.trade}</td>
                    <td>{g.missingField}</td>
                    <td>{g.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
