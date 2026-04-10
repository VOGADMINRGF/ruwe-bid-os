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
  const sourceId = asString(sp.sourceId);
  const region = asString(sp.region);
  const trade = asString(sp.trade);
  const decision = asString(sp.decision);
  const gate = asString(sp.gate);

  const db = await readStore();
  let rows = [...(db.sourceHits || [])];

  if (q) {
    rows = rows.filter((x: any) =>
      [x.title, x.region, x.regionNormalized, x.trade, x.tradeNormalized, x.sourceName].filter(Boolean).join(" ").toLowerCase().includes(q)
    );
  }
  if (sourceId) rows = rows.filter((x: any) => String(x.sourceId || "") === sourceId);
  if (region) rows = rows.filter((x: any) => (x.regionNormalized || x.region || "") === region);
  if (trade) rows = rows.filter((x: any) => (x.tradeNormalized || x.trade || "") === trade);
  if (decision) rows = rows.filter((x: any) => (x.aiRecommendation || x.status || "No-Go") === decision);
  if (gate === "allowed") rows = rows.filter((x: any) => x.aiGateAllowed === true);
  if (gate === "blocked") rows = rows.filter((x: any) => x.aiGateAllowed === false);

  const sources = [...new Set((db.sourceHits || []).map((x: any) => x.sourceId).filter(Boolean))].sort();
  const regions = [...new Set((db.sourceHits || []).map((x: any) => x.regionNormalized || x.region).filter(Boolean))].sort();
  const trades = [...new Set((db.sourceHits || []).map((x: any) => x.tradeNormalized || x.trade).filter(Boolean))].sort();
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
          <select className="select" name="sourceId" defaultValue={sourceId}>
            <option value="">Alle Quellen</option>
            {sources.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
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
          <select className="select" name="gate" defaultValue={gate}>
            <option value="">Alle Vorfilter</option>
            <option value="allowed">AI zugelassen</option>
            <option value="blocked">AI blockiert</option>
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
                <th>Qualität</th>
                <th>Direktlink</th>
                <th>Link-Grund</th>
                <th>Vorfilter</th>
                <th>Vorfilter-Grund</th>
                <th>Query</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row: any) => (
                <tr key={row.id}>
                  <td>{row.externalResolvedUrl ? <a className="linkish" href={row.externalResolvedUrl} target="_blank">{row.title}</a> : row.title}</td>
                  <td>{row.regionNormalized || row.region || "-"}</td>
                  <td>{row.tradeNormalized || row.trade || "-"}</td>
                  <td>{row.sourceName || row.sourceId || "-"}</td>
                  <td>{formatCurrencyCompact(row.estimatedValue)}</td>
                  <td>{row.durationMonths ? `${row.durationMonths} Mon.` : "-"}</td>
                  <td>{row.aiRecommendation || row.status || "-"}</td>
                  <td>{row.sourceQuality || "-"}</td>
                  <td>{row.directLinkValid === true ? "valide" : "nicht valide"}</td>
                  <td>{row.directLinkReason || row.linkStatus || "-"}</td>
                  <td>{row.aiGateAllowed === true ? "zugelassen" : row.aiGateAllowed === false ? "blockiert" : "-"}</td>
                  <td>{row.aiGateReason || "-"}</td>
                  <td>{row.queryUsed || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
