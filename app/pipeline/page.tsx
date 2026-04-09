import Link from "next/link";
import { readStore } from "@/lib/storage";
import { filterPipelineByWindow, pipelineStageBuckets } from "@/lib/pipelineFilters";
import { formatCurrencyCompact } from "@/lib/numberFormat";

type Props = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function asString(v: string | string[] | undefined) {
  return Array.isArray(v) ? v[0] : (v || "");
}

export default async function PipelinePage({ searchParams }: Props) {
  const sp = (await searchParams) || {};
  const windowKey = asString(sp.window) || "all";

  const db = await readStore();
  const all = db.pipeline || [];
  const rows = filterPipelineByWindow(all, windowKey);
  const buckets = pipelineStageBuckets(all);

  return (
    <div className="stack">
      <div>
        <h1 className="h1"><span className="headline-accent">Pipeline</span> & Fristen</h1>
        <p className="sub">Steuerung nach Stage, Frist und Status inklusive Verloren / No-Bid.</p>
      </div>

      <div className="card">
        <form className="table-toolbar" method="GET">
          <select className="select" name="window" defaultValue={windowKey}>
            <option value="all">Alle Zeiträume</option>
            <option value="7d">Fristen bis 7 Tage</option>
            <option value="14d">Fristen bis 14 Tage</option>
            <option value="30d">Fristen bis 30 Tage</option>
            <option value="overdue">Überfällig</option>
            <option value="lost">Verloren / No-Bid</option>
          </select>
          <button className="button" type="submit">Anzeigen</button>
          <Link className="button-secondary" href="/pipeline">Reset</Link>
        </form>

        <div className="stage-board" style={{ marginBottom: 18 }}>
          {buckets.map((b: any) => (
            <div className="stage-card" key={b.stage}>
              <div className="label">{b.stage}</div>
              <div className="stage-count">{b.count}</div>
              <div className="stage-value">{formatCurrencyCompact(b.value)}</div>
            </div>
          ))}
        </div>

        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Titel</th>
                <th>Stage</th>
                <th>Volumen</th>
                <th>Frist</th>
                <th>Tage</th>
                <th>Nächster Schritt</th>
                <th>EOW</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row: any) => (
                <tr key={row.id}>
                  <td>{row.title}</td>
                  <td>{row.stage || "-"}</td>
                  <td>{formatCurrencyCompact(row.value)}</td>
                  <td>{row.dueDate || "-"}</td>
                  <td>{row.daysLeft ?? "-"}</td>
                  <td>{row.nextStep || "-"}</td>
                  <td>{row.eowUpdate || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
