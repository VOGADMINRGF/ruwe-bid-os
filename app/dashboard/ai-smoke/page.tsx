import { readStore } from "@/lib/storage";
import { aiSmokeForHit } from "@/lib/sourceLogic";
import { modeBadgeClass, modeLabel } from "@/lib/format";

export default async function AiSmokePage() {
  const db = await readStore();
  const mode = db.meta?.dataMode || "demo";
  const hits = db.sourceHits || [];

  return (
    <div className="stack">
      <div className="row" style={{ gap: 10, alignItems: "center" }}>
        <h1 className="h1" style={{ margin: 0 }}>AI Test</h1>
        <span className={modeBadgeClass(mode)}>{modeLabel(mode)}</span>
      </div>
      <p className="sub">Heuristische Bid-/Prüfen-/No-Go-Empfehlung für die aktuelle Trefferliste.</p>

      <div className="card table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Titel</th>
              <th>Empfehlung</th>
              <th>Score</th>
              <th>Begründung</th>
            </tr>
          </thead>
          <tbody>
            {hits.map((hit: any) => {
              const a = aiSmokeForHit(hit);
              return (
                <tr key={hit.id}>
                  <td>{hit.title}</td>
                  <td>{a.recommendation}</td>
                  <td>{a.score}</td>
                  <td>{a.explanation}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
