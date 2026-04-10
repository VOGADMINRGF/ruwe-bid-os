import { buildQuellensteuerung } from "@/lib/quellensteuerung";
import SourcesTable from "@/components/sources/SourcesTable";
import SourceRegistryEditor from "@/components/forms/SourceRegistryEditor";

export default async function QuellensteuerungPage() {
  const data = await buildQuellensteuerung();

  const sourceRows = data.rows.map((row: any) => ({
    id: row.id,
    name: row.name,
    status: row.status,
    lastRunAt: row.lastRunAt,
    lastRunCount: row.hitsLastRun,
    supportsDeepLink: row.supportsDeepLink,
    hitsTotal: row.hitsTotal,
    validLinks: row.validLinks,
    invalidLinks: row.invalidLinks,
    operationalHits: row.operationalHits,
    queryStatus: row.queryStatus,
    lastQuery: row.lastQuery,
    resultStatus: row.resultStatus,
    score: row.score,
    scoreBucket: row.scoreBucket,
    scoreReasons: row.scoreReasons
  }));

  const registryRows = data.rows.map((row: any) => ({
    id: row.id,
    name: row.name,
    type: row.type,
    active: row.active,
    legalUse: row.legalUse,
    dataMode: row.dataMode,
    notes: row.notes,
    supportsFeed: row.supportsFeed,
    supportsManualImport: row.supportsManualImport,
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
          <div className="label">Invalid Links</div>
          <div className="kpi-compact">{data.summary.totalInvalidLinks}</div>
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
                <th>Invalid Links</th>
                <th>Operativ</th>
                <th>AI-fähig</th>
                <th>Deep-Link-Güte</th>
                <th>Query</th>
                <th>Query-Status</th>
                <th>Test</th>
                <th>Health</th>
                <th>Score</th>
                <th>Nutzen-Grund</th>
              </tr>
            </thead>
            <tbody>
              {data.rows.map((row: any) => (
                <tr key={row.id}>
                  <td>{row.name}</td>
                  <td>{row.hitsTotal}</td>
                  <td>{row.validLinks}</td>
                  <td>{row.invalidLinks}</td>
                  <td>{row.operationalHits}</td>
                  <td>{row.aiEligible}</td>
                  <td>{row.deepLinkStatus}</td>
                  <td>{row.lastQuery || (row.supportsQuerySearch ? "aktiv, kein Lauf" : "nicht aktiv")}</td>
                  <td>{row.queryStatus || "-"}</td>
                  <td>{row.lastTestOk === true ? "ok" : row.lastTestOk === false ? "offen" : "-"}</td>
                  <td>{row.health || "-"}</td>
                  <td>{row.score}</td>
                  <td>{(row.scoreReasons || []).join(" ") || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <div className="section-title">Source Registry bearbeiten</div>
        <div className="meta" style={{ marginTop: 8 }}>Aktivstatus, Datenmodus, Legal-Use und operative Hinweise pro Quelle.</div>
        <div style={{ marginTop: 14 }}>
          <SourceRegistryEditor rows={registryRows} />
        </div>
      </div>
    </div>
  );
}
