import { readStore } from "@/lib/storage";
import EmptyModuleCard from "@/components/showcase/EmptyModuleCard";

export default async function BuyersPage() {
  const db = await readStore();
  const rows = db.buyers || [];

  return (
    <div className="stack">
      <div>
        <h1 className="h1">Buyers</h1>
        <p className="sub">Auftraggeberbild und strategische Relevanz.</p>
      </div>

      {!rows.length ? (
        <EmptyModuleCard module="buyers" />
      ) : (
        <div className="card table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Typ</th>
                <th>Strategisch</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r: any) => (
                <tr key={r.id}>
                  <td>{r.name}</td>
                  <td>{r.type}</td>
                  <td>{r.strategic ? "Ja" : "Nein"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
