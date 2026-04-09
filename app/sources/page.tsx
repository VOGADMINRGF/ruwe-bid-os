import { readStore } from "@/lib/storage";

export default async function SourcesPage() {
  const db = await readStore();
  const rows = db.sourceRegistry || [];

  return (
    <div className="stack">
      <div>
        <h1 className="h1">Sources</h1>
        <p className="sub">Quellenregister mit rechtlicher/technischer Einordnung.</p>
      </div>
      <div className="card table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Quelle</th>
              <th>Typ</th>
              <th>Official</th>
              <th>Auth</th>
              <th>Legal Use</th>
              <th>Hinweis</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((x: any) => (
              <tr key={x.id}>
                <td>{x.name}</td>
                <td>{x.type}</td>
                <td>{x.official ? "Ja" : "Nein"}</td>
                <td>{x.authRequired ? "Ja" : "Nein"}</td>
                <td>{x.legalUse}</td>
                <td>{x.notes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
