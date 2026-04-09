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
  const stage = asString(sp.stage);
  const q = asString(sp.q).toLowerCase();

  const db = await readStore();
  const all = db.pipeline || [];
  let rows = filterPipelineByWindow(all, windowKey);

  if (stage) rows = rows.filter((x: any) => (x.stage || "") === stage);
  if (q) rows = rows.filter((x: any) => [x.title, x.stage, x.nextStep].filter(Boolean).join(" ").toLowerCase().includes(q));

  const buckets = pipelineStageBuckets(all);
  const lostBucket = {
    stage: "Verloren / No-Bid",
    count: all.filter((x: any) => ["Verloren", "No-Bid", "Abgelehnt"].includes(x.stage)).length,
    value: all.filter((x: any) => ["Verloren", "No-Bid", "Abgelehnt"].includes(x.stage)).reduce((s: number, x: any) => s + Number(x.value || 0), 0)
  };

  const stageBoard = [
    buckets.find((x: any) => x.stage === "Qualifiziert") || { stage: "Qualifiziert", count: 0, value: 0 },
    buckets.find((x: any) => x.stage === "Review") || { stage: "Review", count: 0, value: 0 },
    buckets.find((x: any) => x.stage === "Freigabe intern") || { stage: "Freigabe intern", count: 0, value: 0 },
    buckets.find((x: any) => x.stage === "Angebot") || { stage: "Angebot", count: 0, value: 0 },
    lostBucket
  ];

  return (
    <div className="stack">
      <div>
        <h1 className="h1"><span className="headline-accent">Pipeline</span> & Fristen</h1>
        <p className="sub">Steuerung nach Stage, Frist und Status inklusive Verloren / No-Bid.</p>
      </div>

      <div className="card">
        <form className="table-toolbar" method="GET">
          <input className="input" type="text" name="q" placeholder="Suche Titel / Schritt" defaultValue={q} />
          <select className="select" name="window" defaultValue={windowKey}>
            <option value="all">Alle Zeiträume</option>
            <option value="7d">Fristen bis 7 Tage</option>
            <option value="14d">Fristen bis 14 Tage</option>
            <option value="30d">Fristen bis 30 Tage</option>
            <option value="overdue">Überfällig</option>
            <option value="lost">Verloren / No-Bid</option>
          </select>
          <select className="select" name="stage" defaultValue={stage}>
            <option value="">Alle Stages</option>
            <option value="Qualifiziert">Qualifiziert</option>
            <option value="Review">Review</option>
            <option value="Freigabe intern">Freigabe intern</option>
            <option value="Angebot">Angebot</option>
            <option value="Eingereicht">Eingereicht</option>
            <option value="Verhandlung">Verhandlung</option>
            <option value="Gewonnen">Gewonnen</option>
            <option value="Verloren">Verloren</option>
            <option value="No-Bid">No-Bid</option>
          </select>
          <button className="button" type="submit">Anzeigen</button>
          <Link className="button-secondary" href="/pipeline">Reset</Link>
        </form>

        <div className="stage-board-5" style={{ marginBottom: 18 }}>
          {stageBoard.map((b: any) => (
            <Link key={b.stage} href={b.stage === "Verloren / No-Bid" ? "/pipeline?window=lost" : `/pipeline?stage=${encodeURIComponent(b.stage)}`} className="stage-card">
              <div className="label">{b.stage}</div>
              <div className="stage-count">{b.count}</div>
              <div className="stage-value">{formatCurrencyCompact(b.value)}</div>
            </Link>
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
                  <td><Link className="linkish" href={`/source-hits?q=${encodeURIComponent(row.title || "")}`}>{row.title}</Link></td>
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
