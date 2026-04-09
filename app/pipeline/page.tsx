import Link from "next/link";
import { readDb } from "@/lib/db";

export default async function PipelinePage() {
  const db = await readDb();
  const items = db.pipeline || [];

  return (
    <div className="stack">
      <div>
        <h1 className="h1">Pipeline</h1>
        <p className="sub">Aktive Vorgänge, Stufen und Werte der Vertriebs-Pipeline.</p>
      </div>
      <div className="card table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Titel</th>
              <th>Stage</th>
              <th>Wert</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item: any) => (
              <tr key={item.id}>
                <td>{item.id}</td>
                <td>{item.title}</td>
                <td>{item.stage}</td>
                <td>{item.value?.toLocaleString("de-DE")} €</td>
                <td><Link className="linkish" href={`/pipeline/${item.id}`}>Öffnen</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
