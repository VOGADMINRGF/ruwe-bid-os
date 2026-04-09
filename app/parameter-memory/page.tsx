import { readStore } from "@/lib/storage";

export default async function ParameterMemoryPage() {
  const db = await readStore();
  const rows = Array.isArray(db.parameterMemory) ? db.parameterMemory : [];

  return (
    <div className="stack">
      <div>
        <h1 className="h1"><span className="headline-accent">Parameter</span> & Lernbasis</h1>
        <p className="sub">Gespeicherte regionale Parameter wie Stundenpreis, Monatsrate, Fahrkosten oder sonstige Kalkulationswerte.</p>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Region</th>
                <th>Geschäftsfeld</th>
                <th>Typ</th>
                <th>Key</th>
                <th>Wert</th>
                <th>Status</th>
                <th>Quelle</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row: any) => (
                <tr key={row.id}>
                  <td>{row.region}</td>
                  <td>{row.trade}</td>
                  <td>{row.parameterType}</td>
                  <td>{row.parameterKey}</td>
                  <td>{row.value ?? "-"}</td>
                  <td>{row.status}</td>
                  <td>{row.source || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
