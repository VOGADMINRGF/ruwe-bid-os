import { listAuditLogs } from "@/lib/auditLog";

export default async function AuditPage() {
  const rows = await listAuditLogs(300);

  return (
    <div className="stack">
      <div>
        <h1 className="h1">Audit Log</h1>
        <p className="sub">Nachvollziehbare Operations- und Entscheidungsereignisse.</p>
      </div>

      <div className="card table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Zeit</th>
              <th>Akteur</th>
              <th>Aktion</th>
              <th>Entity</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((x: any) => (
              <tr key={x.id}>
                <td>{x.at}</td>
                <td>{x.actor || "-"}</td>
                <td>{x.action}</td>
                <td>{x.entityType || "-"} {x.entityId || ""}</td>
                <td><pre className="doc">{JSON.stringify(x.details || {}, null, 2)}</pre></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

