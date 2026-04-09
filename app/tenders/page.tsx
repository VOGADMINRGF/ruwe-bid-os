import { readStore } from "@/lib/storage";
import EmptyModuleCard from "@/components/showcase/EmptyModuleCard";

export default async function TendersPage() {
  const db = await readStore();
  const rows = db.tenders || [];

  return (
    <div className="stack">
      <div>
        <h1 className="h1">Tenders</h1>
        <p className="sub">Operative Ausschreibungen mit Entscheidung und Zuständigkeit.</p>
      </div>

      {!rows.length ? (
        <EmptyModuleCard module="tenders" />
      ) : (
        <div className="card table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Titel</th>
                <th>Region</th>
                <th>Gewerk</th>
                <th>Entscheidung</th>
                <th>Frist</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r: any) => (
                <tr key={r.id}>
                  <td>{r.title}</td>
                  <td>{r.region}</td>
                  <td>{r.trade}</td>
                  <td>{r.decision}</td>
                  <td>{r.dueDate || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
