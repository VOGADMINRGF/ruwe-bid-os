import { listQueryRuns } from "@/lib/queryHistory";

export default async function QueryHistoryPage() {
  const rows = await listQueryRuns();

  return (
    <div className="stack">
      <div>
        <h1 className="h1"><span className="headline-accent">Query</span> Historie</h1>
        <p className="sub">Welche Suchläufe Treffer erzeugt haben und wie hoch die Ausbeute war.</p>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Zeit</th>
                <th>Modus</th>
                <th>Queries</th>
                <th>Inserted</th>
                <th>Duplicates</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row: any) => (
                <tr key={row.id}>
                  <td>{row.createdAt}</td>
                  <td>{row.mode || "-"}</td>
                  <td>{row.queryCount || 0}</td>
                  <td>{row.inserted || 0}</td>
                  <td>{row.duplicates || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
