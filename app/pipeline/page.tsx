import { readStore } from "@/lib/storage";
import EmptyModuleCard from "@/components/showcase/EmptyModuleCard";

export default async function PipelinePage() {
  const db = await readStore();
  const rows = db.pipeline || [];

  return (
    <div className="stack">
      <div>
        <h1 className="h1">Pipeline</h1>
        <p className="sub">Qualifizierung, Angebot, Verhandlung und operative Steuerung.</p>
      </div>

      {!rows.length ? (
        <EmptyModuleCard module="pipeline" />
      ) : (
        <div className="card table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Titel</th>
                <th>Stage</th>
                <th>Wert</th>
                <th>Owner</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r: any) => (
                <tr key={r.id}>
                  <td>{r.title}</td>
                  <td>{r.stage}</td>
                  <td>{Math.round((r.value || 0) / 1000)}k €</td>
                  <td>{r.ownerId || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
