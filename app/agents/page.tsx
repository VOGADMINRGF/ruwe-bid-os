import Link from "next/link";
import { readDb } from "@/lib/db";

export default async function AgentsPage() {
  const db = await readDb();
  const items = db.agents || [];

  return (
    <div className="stack">
      <div>
        <h1 className="h1">Agents</h1>
        <p className="sub">Koordinatoren, Spezialisten und Assistenz mit Performance-Sicht.</p>
      </div>
      <div className="card table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Fokus</th>
              <th>Level</th>
              <th>Win-Rate</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item: any) => (
              <tr key={item.id}>
                <td>{item.id}</td>
                <td>{item.name}</td>
                <td>{item.focus}</td>
                <td>{item.level}</td>
                <td>{Math.round(item.winRate * 100)}%</td>
                <td><Link className="linkish" href={`/agents/${item.id}`}>Öffnen</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
