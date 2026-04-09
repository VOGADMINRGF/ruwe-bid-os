import Link from "next/link";
import { readDb } from "@/lib/db";

export default async function BuyersPage() {
  const db = await readDb();
  const items = db.buyers || [];

  return (
    <div className="stack">
      <div>
        <h1 className="h1">Buyers</h1>
        <p className="sub">Auftraggeber mit Typ, strategischer Relevanz und Detailzugriff.</p>
      </div>
      <div className="card table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Typ</th>
              <th>Strategisch</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item: any) => (
              <tr key={item.id}>
                <td>{item.id}</td>
                <td>{item.name}</td>
                <td>{item.type}</td>
                <td>{item.strategic ? "Ja" : "Nein"}</td>
                <td><Link className="linkish" href={`/buyers/${item.id}`}>Öffnen</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
