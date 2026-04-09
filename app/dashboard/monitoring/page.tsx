import { readStore } from "@/lib/storage";

export default async function MonitoringPage() {
  const db = await readStore();
  const stats = db.sourceStats || [];
  return (
    <div className="stack">
      <div>
        <h1 className="h1">Monitoring</h1>
        <p className="sub">Quellenleistung, letzter Abruf und Nutzen pro Anbieter.</p>
      </div>
      <div className="card table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Quelle</th>
              <th>Letzter Abruf</th>
              <th>letzter Monat</th>
              <th>seit letztem Abruf</th>
              <th>vorausgewählt</th>
              <th>Go</th>
              <th>Fehler</th>
              <th>Dubletten</th>
            </tr>
          </thead>
          <tbody>
            {stats.map((s: any) => (
              <tr key={s.id}>
                <td>{s.name}</td>
                <td>{s.lastFetchAt}</td>
                <td>{s.tendersLast30Days}</td>
                <td>{s.tendersSinceLastFetch}</td>
                <td>{s.prefilteredLast30Days}</td>
                <td>{s.goLast30Days}</td>
                <td>{s.errorCountLastRun}</td>
                <td>{s.duplicateCountLastRun}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
