import { readStore } from "@/lib/storage";
import { sourceHealth, sourceUsefulnessScore } from "@/lib/sourceLogic";

function healthBadge(health: string) {
  if (health === "gruen") return "badge badge-gut";
  if (health === "gelb") return "badge badge-gemischt";
  return "badge badge-kritisch";
}

export default async function MonitoringPage() {
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
        <h1 className="h1">Monitoring</h1>
        <p className="sub">Quelle, letzter Abruf, Nutzen, Fehler und Eignung für RUWE.</p>
      </div>

      <div className="card table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Quelle</th>
              <th>Status</th>
              <th>Typ</th>
              <th>Letzter Abruf</th>
              <th>letzter Monat</th>
              <th>seit letztem Abruf</th>
              <th>vorausgewählt</th>
              <th>Go</th>
              <th>Score</th>
              <th>Hinweis</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row: any) => (
              <tr key={row.id}>
                <td>{row.name}</td>
                <td><span className={healthBadge(row.health)}>{row.health}</span></td>
                <td>{row.type}</td>
                <td>{row.lastFetchAt || "-"}</td>
                <td>{row.tendersLast30Days || 0}</td>
                <td>{row.tendersSinceLastFetch || 0}</td>
                <td>{row.prefilteredLast30Days || 0}</td>
                <td>{row.goLast30Days || 0}</td>
                <td>{row.usefulnessScore}</td>
                <td>{row.notes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
