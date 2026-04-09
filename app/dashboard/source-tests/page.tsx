import { readStore } from "@/lib/storage";
import { sourceHealth, sourceUsefulnessScore } from "@/lib/sourceLogic";

function healthBadge(health: string) {
  if (health === "gruen") return "badge badge-gut";
  if (health === "gelb") return "badge badge-gemischt";
  return "badge badge-kritisch";
}

export default async function SourceTestsPage() {
  const db = await readStore();
  const registry = db.sourceRegistry || [];
  const stats = db.sourceStats || [];

  const rows = registry.map((src: any) => {
    const stat = stats.find((s: any) => s.id === src.id) || {};
    return {
      ...src,
      ...stat,
      health: sourceHealth(stat),
      usefulnessScore: sourceUsefulnessScore(stat)
    };
  });

  return (
    <div className="stack">
      <div>
        <h1 className="h1">Source Tests</h1>
        <p className="sub">Hier siehst du sofort, ob eine Quelle zuletzt erfolgreich war.</p>
      </div>

      <div className="card table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Quelle</th>
              <th>Status</th>
              <th>Official</th>
              <th>Auth</th>
              <th>Errors</th>
              <th>Dubletten</th>
              <th>Score</th>
              <th>Legal Use</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row: any) => (
              <tr key={row.id}>
                <td>{row.name}</td>
                <td><span className={healthBadge(row.health)}>{row.health}</span></td>
                <td>{row.official ? "Ja" : "Nein"}</td>
                <td>{row.authRequired ? "Ja" : "Nein"}</td>
                <td>{row.errorCountLastRun || 0}</td>
                <td>{row.duplicateCountLastRun || 0}</td>
                <td>{row.usefulnessScore}</td>
                <td>{row.legalUse}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
