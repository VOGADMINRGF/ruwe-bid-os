import Link from "next/link";
import { readStore } from "@/lib/storage";
import { formatCurrencyCompact } from "@/lib/numberFormat";

type Props = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function asString(v: string | string[] | undefined) {
  return Array.isArray(v) ? v[0] : (v || "");
}

export default async function SourceHitsPage({ searchParams }: Props) {
  const sp = (await searchParams) || {};
  const q = asString(sp.q).toLowerCase();
  const region = asString(sp.region);
  const trade = asString(sp.trade);
  const decision = asString(sp.decision);

  const db = await readStore();
  let rows = [...(db.sourceHits || [])];

  if (q) {
    rows = rows.filter((x: any) =>
      [x.title, x.region, x.trade, x.sourceName].filter(Boolean).join(" ").toLowerCase().includes(q)
    );
  }
  if (region) rows = rows.filter((x: any) => (x.region || "") === region);
  if (trade) rows = rows.filter((x: any) => (x.trade || "") === trade);
  if (decision) rows = rows.filter((x: any) => (x.aiRecommendation || x.status || "") === decision);

  const regions = [...new Set((db.sourceHits || []).map((x: any) => x.region).filter(Boolean))].sort();
  const trades = [...new Set((db.sourceHits || []).map((x: any) => x.trade).filter(Boolean))].sort();
  const decisions = [...new Set((db.sourceHits || []).map((x: any) => x.aiRecommendation || x.status).filter(Boolean))].sort();

  return (
    <div className="stack">
      <div>
        <h1 className="h1"><span className="headline-accent">Treffer</span> & Marktbild</h1>
        <p className="sub">Alle live erfassten Ausschreibungen mit Filterung nach Region, Geschäftsfeld und AI-Entscheidung.</p>
      </div>

      <div className="card">
        <form className="table-toolbar" method="GET">
          <input className="input" type="text" name="q" placeholder="Suche Titel / Region / Quelle" defaultValue={q} />
          <select className="select" name="region" defaultValue={region}>
            <option value="">Alle Regionen</option>
            {regions.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
          <select className="select" name="trade" defaultValue={trade}>
            <option value="">Alle Geschäftsfelder</option>
            {trades.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <select className="select" name="decision" defaultValue={decision}>
            <option value="">Alle Entscheidungen</option>
            {decisions.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
          <button className="button" type="submit">Filtern</button>
          <Link className="button-secondary" href="/source-hits">Reset</Link>
        </form>

        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Titel</th>
                <th>Region</th>
                <th>Geschäftsfeld</th>
                <th>Quelle</th>
                <th>Volumen</th>
                <th>Laufzeit</th>
                <th>AI</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row: any) => (
                <tr key={row.id}>
                  <td>{row.url ? <a className="linkish" href={row.url} target="_blank">{row.title}</a> : row.title}</td>
                  <td>{row.region || "-"}</td>
                  <td>{row.trade || "-"}</td>
                  <td>{row.sourceName || row.sourceId || "-"}</td>
                  <td>{formatCurrencyCompact(row.estimatedValue)}</td>
                  <td>{row.durationMonths ? `${row.durationMonths} Mon.` : "-"}</td>
                  <td>{row.aiRecommendation || row.status || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
