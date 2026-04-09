import { readStore } from "@/lib/storage";
import EmptyModuleCard from "@/components/showcase/EmptyModuleCard";

export default async function ReferencesPage() {
  const db = await readStore();
  const rows = db.references || [];

  return (
    <div className="stack">
      <div>
        <h1 className="h1">References</h1>
        <p className="sub">Referenzen zur späteren Vertriebsargumentation und Eignung.</p>
      </div>

      {!rows.length ? (
        <EmptyModuleCard module="references" />
      ) : (
        <div className="card table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Titel</th>
                <th>Gewerk</th>
                <th>Region</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r: any) => (
                <tr key={r.id}>
                  <td>{r.title}</td>
                  <td>{r.trade}</td>
                  <td>{r.region}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
