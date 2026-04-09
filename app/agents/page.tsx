import { readStore } from "@/lib/storage";
import EmptyModuleCard from "@/components/showcase/EmptyModuleCard";

export default async function AgentsPage() {
  const db = await readStore();
  const agents = db.agents || [];

  return (
    <div className="stack">
      <div>
        <h1 className="h1">Agents</h1>
        <p className="sub">Rollen, Zuständigkeiten und Demo-/Produktivsteuerung.</p>
      </div>

      {!agents.length ? (
        <EmptyModuleCard module="agents" />
      ) : (
        <div className="card table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Fokus</th>
                <th>Level</th>
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
                  <td>{Math.round((a.winRate || 0) * 100)}%</td>
                  <td>{Math.round((a.pipelineValue || 0) / 1000)}k €</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
