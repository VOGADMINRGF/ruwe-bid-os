import { readStore } from "@/lib/storage";
import { sourceHealth, sourceUsefulnessExplain } from "@/lib/sourceLogic";
import { formatDateTime, dataModeLabel, dataModeBadgeClass } from "@/lib/format";

function healthBadge(health: string) {
  if (health === "gruen") return "badge badge-gut";
  if (health === "gelb") return "badge badge-gemischt";
  return "badge badge-kritisch";
}

export default async function MonitoringPage() {
  const db = await readStore();
  const registry = db.sourceRegistry || [];
  const stats = db.sourceStats || [];
  const hits = db.sourceHits || [];
  const queryHistory = db.queryHistory || [];
  const mode = db.meta?.dataMode || "demo";

  const rows = registry.map((src: any) => {
    const stat = stats.find((s: any) => s.id === src.id || s.sourceId === src.id) || {};
    const explain = sourceUsefulnessExplain({
      stat,
      hits: hits.filter((x: any) => x.sourceId === src.id),
      queryRuns: queryHistory.filter((x: any) => x.sourceId === src.id).slice(0, 8)
    });
    return {
      ...src,
      ...stat,
      health: sourceHealth(stat, { hits: hits.filter((x: any) => x.sourceId === src.id) }),
      usefulnessScore: explain.score,
      usefulnessReasons: explain.reasons
    };
  });

  return (
    <div className="stack">
      <div>
        <div className="row" style={{ gap: 10, alignItems: "center" }}>
          <h1 className="h1" style={{ margin: 0 }}>Monitoring</h1>
          <span className={dataModeBadgeClass(mode)}>{dataModeLabel(mode)}</span>
        </div>
        <p className="sub">Quelle, letzter Abruf, Nutzen, Fehler und Einordnung für RUWE.</p>
      </div>

      <div className="card table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Quelle</th>
              <th>Status</th>
              <th>Typ</th>
              <th>Modus</th>
              <th>Letzter Abruf</th>
              <th>Letzter Monat</th>
              <th>Seit letztem Abruf</th>
              <th>Vorausgewählt</th>
              <th>Go</th>
              <th>Score</th>
              <th>Erklärung</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row: any) => (
              <tr key={row.id}>
                <td>{row.name}</td>
                <td><span className={healthBadge(row.health)}>{row.health}</span></td>
                <td>{row.type}</td>
                <td>{dataModeLabel(row.dataMode || mode)}</td>
                <td>{formatDateTime(row.lastFetchAt)}</td>
                <td>{row.tendersLast30Days || 0}</td>
                <td>{row.tendersSinceLastFetch || 0}</td>
                <td>{row.prefilteredLast30Days || 0}</td>
                <td>{row.goLast30Days || 0}</td>
                <td>{row.usefulnessScore}</td>
                <td>{(row.usefulnessReasons || []).join(" ") || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
