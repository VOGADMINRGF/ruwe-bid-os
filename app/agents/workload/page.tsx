import { computeAgentWorkload } from "@/lib/agentWorkload";

export default async function AgentWorkloadPage() {
  const rows = await computeAgentWorkload();

  return (
    <div className="stack">
      <div>
        <h1 className="h1"><span className="headline-accent">Agenten</span> & Auslastung</h1>
        <p className="sub">Koordinatoren und Assistenzen mit offenen Vorgängen, Priorität und Überfälligkeiten.</p>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Rolle</th>
                <th>Fokus</th>
                <th>Zugewiesen</th>
                <th>Offen</th>
                <th>Überfällig</th>
                <th>Priorität A</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row: any) => (
                <tr key={row.id}>
                  <td>{row.name}</td>
                  <td>{row.role}</td>
                  <td>{row.regionFocus}</td>
                  <td>{row.assigned}</td>
                  <td>{row.open}</td>
                  <td>{row.overdue}</td>
                  <td>{row.highPriority}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
