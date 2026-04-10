import { readStore } from "@/lib/storage";
import { sourceHealth, sourceUsefulnessExplain } from "@/lib/sourceLogic";
import { dataModeLabel, dataModeBadgeClass } from "@/lib/format";
import SourceTestsActions from "@/components/dashboard/SourceTestsActions";

function healthBadge(health: string) {
  if (health === "gruen") return "badge badge-gut";
  if (health === "gelb") return "badge badge-gemischt";
  return "badge badge-kritisch";
}

export default async function SourceTestsPage() {
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
          <h1 className="h1" style={{ margin: 0 }}>Source Tests</h1>
          <span className={dataModeBadgeClass(mode)}>{dataModeLabel(mode)}</span>
        </div>
        <p className="sub">Führt Connector-Selbsttests aus und zeigt operative Nutzbarkeit je Quelle mit Begründung.</p>
        <SourceTestsActions />
      </div>

      <div className="card table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Quelle</th>
              <th>Status</th>
              <th>Modus</th>
              <th>Official</th>
              <th>Auth</th>
              <th>Errors</th>
              <th>Dubletten</th>
              <th>Score</th>
              <th>Erklärung</th>
              <th>Legal Use</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row: any) => (
              <tr key={row.id}>
                <td>{row.name}</td>
                <td><span className={healthBadge(row.health)}>{row.health}</span></td>
                <td>{dataModeLabel(row.dataMode || mode)}</td>
                <td>{row.official ? "Ja" : "Nein"}</td>
                <td>{row.authRequired ? "Ja" : "Nein"}</td>
                <td>{row.errorCountLastRun || 0}</td>
                <td>{row.duplicateCountLastRun || 0}</td>
                <td>{row.usefulnessScore}</td>
                <td>{(row.usefulnessReasons || []).join(" ") || "-"}</td>
                <td>{row.legalUse}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
