import { readStore } from "@/lib/storage";
import { smokeSummary } from "@/lib/sourceLogic";
import { modeBadgeClass, modeLabel } from "@/lib/format";

export default async function SmokePage() {
  const db = await readStore();
  const summary = smokeSummary(db);

  return (
    <div className="stack">
      <div className="row" style={{ gap: 10, alignItems: "center" }}>
        <h1 className="h1" style={{ margin: 0 }}>Smoke Test</h1>
        <span className={modeBadgeClass(summary.mode)}>{modeLabel(summary.mode)}</span>
      </div>
      <p className="sub">Schneller Strukturtest: Was liegt aktuell im System vor und wie verteilt es sich auf die Quellen?</p>

      <div className="grid grid-4">
        <div className="card"><div className="label">Treffer gesamt</div><div className="kpi">{summary.totalHits}</div></div>
        <div className="card"><div className="label">Neu seit letztem Abruf</div><div className="kpi">{summary.newSinceLastFetch}</div></div>
        <div className="card"><div className="label">Bid-Kandidaten</div><div className="kpi">{summary.prefiltered}</div></div>
        <div className="card"><div className="label">Manuell prüfen</div><div className="kpi">{summary.manualReview}</div></div>
      </div>

      <div className="card table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Quelle</th>
              <th>Treffer</th>
            </tr>
          </thead>
          <tbody>
            {summary.bySource.map((row: any) => (
              <tr key={row.source}>
                <td>{row.source}</td>
                <td>{row.hits}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
