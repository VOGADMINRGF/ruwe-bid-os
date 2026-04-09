import { readStore } from "@/lib/storage";

export default async function AgentsPage() {
  const db = await readStore();
  const agents = db.agents || [];

  return (
    <div className="stack">
      <div>
        <h1 className="h1">Agents</h1>
        <p className="sub">Vier Koordinationen und zwei Assistenzen als operative Grundstruktur für Monitoring, Review und Pipeline-Pflege.</p>
      </div>

      <div className="card table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Fokus</th>
              <th>Rolle</th>
              <th>Aufgabe</th>
              <th>EOW-Pflege</th>
              <th>Win-Rate</th>
              <th>Pipeline</th>
            </tr>
          </thead>
          <tbody>
            {agents.map((a: any) => (
              <tr key={a.id}>
                <td>{a.name}</td>
                <td>{a.focus}</td>
                <td>{a.level}</td>
                <td>{a.responsibility || "-"}</td>
                <td>{a.weeklyTask || "-"}</td>
                <td>{Math.round((a.winRate || 0) * 100)}%</td>
                <td>{Math.round((a.pipelineValue || 0) / 1000)}k €</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
