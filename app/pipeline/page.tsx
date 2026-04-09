import { readStore } from "@/lib/storage";

function grouped(rows: any[]) {
  const stages = ["Qualifiziert", "Review", "Freigabe intern", "Angebot", "Beobachtet", "Eingereicht", "Verhandlung", "Gewonnen", "Verloren"];
  return stages.map((stage) => ({
    stage,
    items: rows.filter((x) => x.stage === stage)
  })).filter((x) => x.items.length > 0);
}

export default async function PipelinePage() {
  const db = await readStore();
  const rows = db.pipeline || [];
  const groups = grouped(rows);

  return (
    <div className="stack">
      <div>
        <h1 className="h1">Pipeline</h1>
        <p className="sub">Operative Übersicht über Chancen, Stages, nächste Schritte und die Pflege bis Ende der Woche.</p>
      </div>

      <div className="grid grid-4">
        <div className="card"><div className="label">Chancen</div><div className="kpi">{rows.length}</div></div>
        <div className="card"><div className="label">A-Priorität</div><div className="kpi">{rows.filter((x: any) => x.priority === "A").length}</div></div>
        <div className="card"><div className="label">Im Review</div><div className="kpi">{rows.filter((x: any) => x.stage === "Review").length}</div></div>
        <div className="card"><div className="label">Wert gesamt</div><div className="kpi">{Math.round(rows.reduce((sum: number, x: any) => sum + (x.value || 0), 0) / 1000)}k €</div></div>
      </div>

      {groups.map((group) => (
        <div className="card" key={group.stage}>
          <div className="section-title">{group.stage}</div>
          <div className="table-wrap" style={{ marginTop: 12 }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Titel</th>
                  <th>Priorität</th>
                  <th>Wert</th>
                  <th>Nächster Schritt</th>
                  <th>EOW</th>
                  <th>AI Score</th>
                </tr>
              </thead>
              <tbody>
                {group.items.map((item: any) => (
                  <tr key={item.id}>
                    <td>{item.title}</td>
                    <td>{item.priority || "-"}</td>
                    <td>{Math.round((item.value || 0) / 1000)}k €</td>
                    <td>{item.nextStep || "-"}</td>
                    <td>{item.eowUpdate || "-"}</td>
                    <td>{item.aiScore || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}
