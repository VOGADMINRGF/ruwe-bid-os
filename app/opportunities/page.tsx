import { readStore } from "@/lib/storage";

export default async function OpportunitiesPage() {
  const db = await readStore();
  const rows = Array.isArray(db.opportunities) ? db.opportunities : [];

  return (
    <div className="stack">
      <div>
        <h1 className="h1">Opportunities</h1>
        <p className="sub">Normierte Ausschreibungsobjekte mit Zuständigkeit, Kalkulationslogik und offenen Variablen.</p>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Titel</th>
                <th>Region</th>
                <th>Gewerk</th>
                <th>Entscheidung</th>
                <th>Kalkulationsmodus</th>
                <th>Offene Variablen</th>
                <th>Owner</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((x: any) => (
                <tr key={x.id}>
                  <td>{x.title}</td>
                  <td>{x.region}</td>
                  <td>{x.trade}</td>
                  <td>{x.decision}</td>
                  <td>{x.calcMode}</td>
                  <td>{x.missingVariableCount}</td>
                  <td>{x.ownerId || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
