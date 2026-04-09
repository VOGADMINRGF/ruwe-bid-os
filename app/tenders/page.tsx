import Link from "next/link";
import { readDb } from "@/lib/db";

export default async function TendersPage() {
  const db = await readDb();
  const tenders = db.tenders || [];

  return (
    <div className="stack">
      <div>
        <h1 className="h1">Tenders</h1>
        <p className="sub">Ausschreibungsregister mit Region, Gewerk, Status und Detailzugriff.</p>
      </div>
      <div className="card table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Titel</th>
              <th>Region</th>
              <th>Gewerk</th>
              <th>Priorität</th>
              <th>Entscheidung</th>
              <th>Frist</th>
            </tr>
          </thead>
          <tbody>
            {tenders.map((t: any) => (
              <tr key={t.id}>
                <td><Link className="linkish" href={`/tenders/${t.id}`}>{t.title}</Link></td>
                <td>{t.region}</td>
                <td>{t.trade}</td>
                <td>{t.priority}</td>
                <td>{t.decision}</td>
                <td>{t.dueDate || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
