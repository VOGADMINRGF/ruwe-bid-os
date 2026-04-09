import { readStore } from "@/lib/storage";

export default async function AiResultsPage() {
  const db = await readStore();
  const hits = db.sourceHits || [];
  const analyzed = hits.filter((x: any) => x.aiRecommendation);

  return (
    <div className="stack">
      <div>
        <h1 className="h1">AI Ergebnisse</h1>
        <p className="sub">Empfehlungen, Begründungen und nächste Schritte für die aktuelle Trefferlage.</p>
      </div>

      <div className="card table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Titel</th>
              <th>Empfehlung</th>
              <th>Score</th>
              <th>Zusammenfassung</th>
              <th>Nächster Schritt</th>
              <th>Provider</th>
            </tr>
          </thead>
          <tbody>
            {analyzed.map((x: any) => (
              <tr key={x.id}>
                <td>{x.title}</td>
                <td>{x.aiRecommendation}</td>
                <td>{x.aiScore || 0}</td>
                <td>{x.aiSummary || "-"}</td>
                <td>{x.aiNextStep || "-"}</td>
                <td>{x.aiProvider || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
