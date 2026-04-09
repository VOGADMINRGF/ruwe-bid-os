import Link from "next/link";
import { readStore } from "@/lib/storage";
import { sourceSummary } from "@/lib/sourceControl";

export default async function SourcesPage() {
  const db = await readStore();
  const rows = sourceSummary(db.sourceRegistry || []);

  return (
    <div className="stack">
      <div>
        <h1 className="h1"><span className="headline-accent">Quellen</span> & Abrufstatus</h1>
        <p className="sub">Welche Plattform wurde wann abgefragt und wie belastbar ist ihr operativer Nutzen.</p>
      </div>

      <div className="toolbar">
        <a className="button" href="/api/ops/run-all">Run All</a>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Quelle</th>
                <th>Status</th>
                <th>Letzter Lauf</th>
                <th>Treffer</th>
                <th>Deep-Link</th>
                <th>Aktion</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row: any) => (
                <tr key={row.id}>
                  <td>{row.name}</td>
                  <td>{row.status}</td>
                  <td>{row.lastRunAt || "-"}</td>
                  <td>{row.lastRunCount}</td>
                  <td>{row.supportsDeepLink ? "ja" : "nein / unklar"}</td>
                  <td>
                    <a className="linkish" href={`/api/ops/source-refresh?sourceId=${encodeURIComponent(row.id)}`}>Einzeln abrufen</a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
