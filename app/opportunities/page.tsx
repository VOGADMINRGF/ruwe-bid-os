import { readStore } from "@/lib/storage";
import Link from "next/link";

function n(v: any) {
  const x = Number(v || 0);
  return Number.isFinite(x) ? x : 0;
}

export default async function OpportunitiesPage({
  searchParams
}: {
  searchParams?: Promise<{
    sort?: string;
    q?: string;
    source?: string;
    region?: string;
    trade?: string;
    decision?: string;
    stage?: string;
    owner?: string;
  }>
}) {
  const params = (await searchParams) || {};
  const sort = params.sort || "fit";
  const q = String(params.q || "").toLowerCase();
  const source = String(params.source || "");
  const region = String(params.region || "");
  const trade = String(params.trade || "");
  const decision = String(params.decision || "");
  const stage = String(params.stage || "");
  const owner = String(params.owner || "");

  const db = await readStore();
  const allRows = Array.isArray(db.opportunities) ? db.opportunities : [];
  const sourceNames = new Map<string, string>();
  for (const src of Array.isArray(db.sourceRegistry) ? db.sourceRegistry : []) {
    sourceNames.set(String(src.id || ""), String(src.name || src.id || ""));
  }

  let rows = [...allRows];

  if (q) {
    rows = rows.filter((x: any) =>
      [
        x.title,
        x.region,
        x.trade,
        x.decision,
        x.fitReasonShort,
        x.noBidReason,
        x.ownerId,
        x.sourceId
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }
  if (source) rows = rows.filter((x: any) => String(x.sourceId || "") === source);
  if (region) rows = rows.filter((x: any) => String(x.region || "") === region);
  if (trade) rows = rows.filter((x: any) => String(x.trade || "") === trade);
  if (decision) rows = rows.filter((x: any) => String(x.decision || "") === decision);
  if (stage) rows = rows.filter((x: any) => String(x.stage || "") === stage);
  if (owner) rows = rows.filter((x: any) => String(x.ownerId || "") === owner);

  rows = [...rows].sort((a: any, b: any) => {
    if (sort === "region") return String(a.region || "").localeCompare(String(b.region || ""));
    if (sort === "trade") return String(a.trade || "").localeCompare(String(b.trade || ""));
    if (sort === "decision") return String(a.decision || "").localeCompare(String(b.decision || ""));
    if (sort === "owner") return String(a.ownerId || "").localeCompare(String(b.ownerId || ""));
    if (sort === "source") return String(a.sourceId || "").localeCompare(String(b.sourceId || ""));
    if (sort === "volume") return n(b.estimatedValue) - n(a.estimatedValue);
    return n(b.fitScore) - n(a.fitScore);
  });

  const sources = [...new Set(allRows.map((x: any) => x.sourceId).filter(Boolean))].sort();
  const regions = [...new Set(allRows.map((x: any) => x.region).filter(Boolean))].sort();
  const trades = [...new Set(allRows.map((x: any) => x.trade).filter(Boolean))].sort();
  const decisions = [...new Set(allRows.map((x: any) => x.decision).filter(Boolean))].sort();
  const stages = [...new Set(allRows.map((x: any) => x.stage).filter(Boolean))].sort();
  const owners = [...new Set(allRows.map((x: any) => x.ownerId).filter(Boolean))].sort();

  return (
    <div className="stack">
      <div>
        <h1 className="h1">Opportunities</h1>
        <p className="sub">Normierte Ausschreibungsobjekte mit Priorisierung, Fit-Logik und offener Variablenlage.</p>
      </div>

      <div className="card">
        <form className="table-toolbar" method="GET" style={{ marginBottom: 14 }}>
          <input className="input" type="text" name="q" placeholder="Suche Titel / Grund / Owner" defaultValue={q} />
          <select className="select" name="source" defaultValue={source}>
            <option value="">Alle Quellen</option>
            {sources.map((id) => (
              <option key={id} value={id}>{sourceNames.get(id) || id}</option>
            ))}
          </select>
          <select className="select" name="region" defaultValue={region}>
            <option value="">Alle Regionen</option>
            {regions.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
          <select className="select" name="trade" defaultValue={trade}>
            <option value="">Alle Gewerke</option>
            {trades.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <select className="select" name="decision" defaultValue={decision}>
            <option value="">Alle Entscheidungen</option>
            {decisions.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
          <select className="select" name="stage" defaultValue={stage}>
            <option value="">Alle Stages</option>
            {stages.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select className="select" name="owner" defaultValue={owner}>
            <option value="">Alle Owner</option>
            {owners.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
          <select className="select" name="sort" defaultValue={sort}>
            <option value="fit">Sortierung: Fit</option>
            <option value="volume">Volumen</option>
            <option value="region">Region</option>
            <option value="trade">Gewerk</option>
            <option value="decision">Entscheidung</option>
            <option value="owner">Owner</option>
            <option value="source">Quelle</option>
          </select>
          <button className="button" type="submit">Filtern</button>
          <Link className="button button-secondary" href="/opportunities">Reset</Link>
        </form>

        <div className="toolbar" style={{ marginBottom: 14, display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Link className="button button-secondary" href="/opportunities?sort=fit">Sortierung: Fit</Link>
          <Link className="button button-secondary" href="/opportunities?sort=volume">Volumen</Link>
          <Link className="button button-secondary" href="/opportunities?sort=region">Region</Link>
          <Link className="button button-secondary" href="/opportunities?sort=trade">Gewerk</Link>
          <Link className="button button-secondary" href="/opportunities?sort=decision">Entscheidung</Link>
          <Link className="button button-secondary" href="/opportunities?sort=owner">Owner</Link>
          <Link className="button button-secondary" href="/opportunities?sort=source">Quelle</Link>
        </div>

        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Titel</th>
                <th>Quelle</th>
                <th>Region</th>
                <th>Gewerk</th>
                <th>Fit</th>
                <th>Entscheidung</th>
                <th>Stage</th>
                <th>Kalkulationsmodus</th>
                <th>Offene Variablen</th>
                <th>Owner</th>
                <th>Nächster Schritt</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((x: any) => (
                <tr key={x.id}>
                  <td>
                    <Link className="linkish" href={`/opportunities/${encodeURIComponent(x.id)}`}>
                      {x.title}
                    </Link>
                    {x.decision === "No-Go" || x.decision === "No-Bid" ? (
                      <div className="meta" style={{ marginTop: 6 }}>
                        {x.noBidReason || x.fitReasonShort || "Der Fall passt derzeit operativ nicht ausreichend ins Zielbild."}
                      </div>
                    ) : x.fitReasonShort ? (
                      <div className="meta" style={{ marginTop: 6 }}>
                        {x.fitReasonShort}
                      </div>
                    ) : null}
                  </td>
                  <td>{sourceNames.get(String(x.sourceId || "")) || x.sourceId || "-"}</td>
                  <td>{x.region}</td>
                  <td>{x.trade}</td>
                  <td>{x.fitScore ?? "-"}</td>
                  <td>{x.decision}</td>
                  <td>{x.stage || "-"}</td>
                  <td>{x.calcMode}</td>
                  <td>{x.missingVariableCount}</td>
                  <td>{x.ownerId}</td>
                  <td>{x.nextStep || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
