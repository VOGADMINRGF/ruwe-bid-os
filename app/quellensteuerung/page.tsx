import { buildQuellensteuerung } from "@/lib/quellensteuerung";
import SourcesTable from "@/components/sources/SourcesTable";

export default async function QuellensteuerungPage() {
  const data = await buildQuellensteuerung();

  const sourceRows = data.rows.map((row: any) => ({
    id: row.id,
    name: row.name,
    status: row.status,
    lastRunAt: row.lastRunAt,
    lastRunCount: row.hitsLastRun,
    supportsDeepLink: row.supportsDeepLink
  }));

  return (
    <div className="stack">
      <div>
        <h1 className="h1"><span className="headline-accent">Quellen</span>steuerung</h1>
        <p className="sub">Abruf, Status, Query-Fähigkeit, Deep-Link-Güte, Testlauf und operative Nutzbarkeit in einer gemeinsamen Konsole.</p>
      </div>

      <div className="grid grid-4">
        <div className="card">
          <div className="label">Quellen</div>
          <div className="kpi-compact">{data.summary.sourceCount}</div>
        </div>
        <div className="card">
          <div className="label">Treffer gesamt</div>
          <div className="kpi-compact">{data.summary.totalHits}</div>
        </div>
        <div className="card">
          <div className="label">Valide Links</div>
          <div className="kpi-compact">{data.summary.totalValidLinks}</div>
        </div>
        <div className="card">
          <div className="label">AI-fähig</div>
          <div className="kpi-compact">{data.summary.totalAiEligible}</div>
        </div>
      </div>

      <SourcesTable initialRows={sourceRows} />

      <div className="card">
        <div className="section-title">Quellenstatus im Detail</div>
        <div className="table-wrap" style={{ marginTop: 14 }}>
          <table className="table">
            <thead>
              <tr>
                <th>Quelle</th>
                <th>Treffer gesamt</th>
                <th>Valide Links</th>
                <th>Operativ</th>
                <th>AI-fähig</th>
                <th>Deep-Link-Güte</th>
                <th>Query</th>
                <th>Test</th>
                <th>Score</th>
              </tr>
            </thead>
            <tbody>
              {data.rows.map((row: any) => (
                <tr key={row.id}>
                  <td>{row.name}</td>
                  <td>{row.hitsTotal}</td>
                  <td>{row.validLinks}</td>
                  <td>{row.operational}</td>
                  <td>{row.aiEligible}</td>
                  <td>{row.deepLinkStatus}</td>
                  <td>{row.supportsQuerySearch ? "ja" : "nein"}</td>
                  <td>{row.lastTestOk === true ? "ok" : row.lastTestOk === false ? "offen" : "-"}</td>
                  <td>{row.score}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
