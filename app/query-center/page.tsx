import { readStore } from "@/lib/storage";
import ManualImportForm from "@/components/query/ManualImportForm";

export default async function QueryCenterPage() {
  const db = await readStore();
  const hits = Array.isArray(db.sourceHits) ? db.sourceHits : [];
  const queryHits = hits.filter((x: any) => x.discoveryMode === "search_query").slice(0, 20);
  const manualHits = hits.filter((x: any) => x.discoveryMode === "manual_import").slice(0, 20);

  return (
    <div className="stack">
      <div>
        <h1 className="h1"><span className="headline-accent">Query</span> Center</h1>
        <p className="sub">Gezielte Keyword-Suche pro Quelle sowie manueller Import einzelner Ausschreibungslinks.</p>
      </div>

      <div className="toolbar">
        <form action="/api/ops/query-ingest" method="POST">
          <button className="button" type="submit">Query-Ingest starten</button>
        </form>
      </div>

      <div className="grid grid-2">
        <div className="card">
          <div className="section-title">Manueller Import</div>
          <div style={{ marginTop: 16 }}>
            <ManualImportForm />
          </div>
        </div>

        <div className="card">
          <div className="section-title">Query-Treffer zuletzt</div>
          <div className="table-wrap" style={{ marginTop: 14 }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Titel</th>
                  <th>Quelle</th>
                  <th>Query</th>
                </tr>
              </thead>
              <tbody>
                {queryHits.map((row: any) => (
                  <tr key={row.id}>
                    <td>{row.title}</td>
                    <td>{row.sourceId}</td>
                    <td>{row.queryUsed || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="section-title">Manuell importierte Treffer</div>
        <div className="table-wrap" style={{ marginTop: 14 }}>
          <table className="table">
            <thead>
              <tr>
                <th>Titel</th>
                <th>Quelle</th>
                <th>Direktlink</th>
              </tr>
            </thead>
            <tbody>
              {manualHits.map((row: any) => (
                <tr key={row.id}>
                  <td>{row.title}</td>
                  <td>{row.sourceId}</td>
                  <td>{row.externalResolvedUrl ? "ja" : "nein"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
