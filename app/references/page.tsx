import Link from "next/link";
import { readDb } from "@/lib/db";

export default async function ReferencesPage() {
  const db = await readDb();
  const items = db.references || [];

  return (
    <div className="stack">
      <div>
        <h1 className="h1">References</h1>
        <p className="sub">Referenzdatenbank für spätere Angebots- und Fit-Unterstützung.</p>
      </div>
      <div className="card table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Titel</th>
              <th>Gewerk</th>
              <th>Region</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item: any) => (
              <tr key={item.id}>
                <td>{item.id}</td>
                <td>{item.title}</td>
                <td>{item.trade}</td>
                <td>{item.region}</td>
                <td><Link className="linkish" href={`/references/${item.id}`}>Öffnen</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
