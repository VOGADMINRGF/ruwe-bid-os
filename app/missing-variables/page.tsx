import { readStore } from "@/lib/storage";
import Link from "next/link";

export default async function MissingVariablesPage() {
  const db = await readStore();
  const rows = Array.isArray(db.costGaps) ? db.costGaps : [];

  return (
    <div className="stack">
      <div>
        <h1 className="h1">Missing Variables</h1>
        <p className="sub">Gezielte Rückfragen für Stunden, Fläche, Frist, Linkvalidität und regionale Standardsätze.</p>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Frage</th>
                <th>Typ</th>
                <th>Region</th>
                <th>Gewerk</th>
                <th>Priorität</th>
                <th>Owner</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((x: any) => (
                <tr key={x.id}>
                  <td><Link className="linkish" href={`/missing-variables/${encodeURIComponent(x.id)}`}>{x.question}</Link></td>
                  <td>{x.type}</td>
                  <td>{x.region}</td>
                  <td>{x.trade}</td>
                  <td>{x.priority}</td>
                  <td>{x.ownerId || "-"}</td>
                  <td>{x.status || "offen"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
