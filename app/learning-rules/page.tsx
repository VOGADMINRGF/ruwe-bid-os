import { listLearningRules } from "@/lib/learningRules";

export default async function LearningRulesPage() {
  const rows = await listLearningRules();

  return (
    <div className="stack">
      <div>
        <h1 className="h1">Learning Rules</h1>
        <p className="sub">Gespeicherte Freigabe- und Blockerlogik für ähnliche Angebote.</p>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Region</th>
                <th>Gewerk</th>
                <th>Aktion</th>
                <th>Grund</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((x: any) => (
                <tr key={x.id}>
                  <td>{x.region || "-"}</td>
                  <td>{x.trade || "-"}</td>
                  <td>{x.action}</td>
                  <td>{x.reason || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
