import { readStore } from "@/lib/storage";
import Link from "next/link";

export default async function MissingVariablesPage({
  searchParams
}: {
  searchParams?: Promise<{
    sort?: string;
    q?: string;
    region?: string;
    trade?: string;
    owner?: string;
    status?: string;
    priority?: string;
  }>
}) {
  const params = (await searchParams) || {};
  const sort = params.sort || "priority";
  const q = String(params.q || "").toLowerCase();
  const region = String(params.region || "");
  const trade = String(params.trade || "");
  const owner = String(params.owner || "");
  const status = String(params.status || "");
  const priority = String(params.priority || "");

  const db = await readStore();
  const allRows = Array.isArray(db.costGaps) ? db.costGaps : [];
  let rows = [...allRows];

  if (q) {
    rows = rows.filter((x: any) =>
      [x.question, x.type, x.region, x.trade, x.ownerId, x.supportOwnerId, x.status]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }
  if (region) rows = rows.filter((x: any) => String(x.region || "") === region);
  if (trade) rows = rows.filter((x: any) => String(x.trade || "") === trade);
  if (owner) rows = rows.filter((x: any) => String(x.ownerId || "") === owner);
  if (status) rows = rows.filter((x: any) => String(x.status || "offen") === status);
  if (priority) rows = rows.filter((x: any) => String(x.priority || "") === priority);

  rows = [...rows].sort((a: any, b: any) => {
    if (sort === "region") return String(a.region || "").localeCompare(String(b.region || ""));
    if (sort === "trade") return String(a.trade || "").localeCompare(String(b.trade || ""));
    if (sort === "owner") return String(a.ownerId || "").localeCompare(String(b.ownerId || ""));
    if (sort === "status") return String(a.status || "offen").localeCompare(String(b.status || "offen"));
    const prio = { hoch: 3, mittel: 2, niedrig: 1 } as Record<string, number>;
    return (prio[b.priority || "niedrig"] || 0) - (prio[a.priority || "niedrig"] || 0);
  });

  const regions = [...new Set(allRows.map((x: any) => x.region).filter(Boolean))].sort();
  const trades = [...new Set(allRows.map((x: any) => x.trade).filter(Boolean))].sort();
  const owners = [...new Set(allRows.map((x: any) => x.ownerId).filter(Boolean))].sort();
  const statuses = [...new Set(allRows.map((x: any) => x.status || "offen").filter(Boolean))].sort();
  const priorities = [...new Set(allRows.map((x: any) => x.priority).filter(Boolean))].sort();

  return (
    <div className="stack">
      <div>
        <h1 className="h1">Missing Variables</h1>
        <p className="sub">Gezielte Rückfragen für Stunden, Fläche, Frist, Linkvalidität und regionale Standardsätze.</p>
      </div>

      <div className="card">
        <form className="table-toolbar" method="GET" style={{ marginBottom: 14 }}>
          <input className="input" type="text" name="q" placeholder="Suche Frage / Typ / Owner" defaultValue={q} />
          <select className="select" name="region" defaultValue={region}>
            <option value="">Alle Regionen</option>
            {regions.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
          <select className="select" name="trade" defaultValue={trade}>
            <option value="">Alle Gewerke</option>
            {trades.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <select className="select" name="owner" defaultValue={owner}>
            <option value="">Alle Owner</option>
            {owners.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
          <select className="select" name="status" defaultValue={status}>
            <option value="">Alle Status</option>
            {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select className="select" name="priority" defaultValue={priority}>
            <option value="">Alle Prioritäten</option>
            {priorities.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
          <select className="select" name="sort" defaultValue={sort}>
            <option value="priority">Sortierung: Priorität</option>
            <option value="region">Region</option>
            <option value="trade">Gewerk</option>
            <option value="owner">Owner</option>
            <option value="status">Status</option>
          </select>
          <button className="button" type="submit">Filtern</button>
          <Link className="button button-secondary" href="/missing-variables">Reset</Link>
        </form>

        <div className="toolbar" style={{ marginBottom: 14, display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Link className="button button-secondary" href="/missing-variables?sort=priority">Priorität</Link>
          <Link className="button button-secondary" href="/missing-variables?sort=region">Region</Link>
          <Link className="button button-secondary" href="/missing-variables?sort=trade">Gewerk</Link>
          <Link className="button button-secondary" href="/missing-variables?sort=owner">Owner</Link>
          <Link className="button button-secondary" href="/missing-variables?sort=status">Status</Link>
        </div>

        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Frage</th>
                <th>Typ</th>
                <th>Antworttyp</th>
                <th>Region</th>
                <th>Gewerk</th>
                <th>Priorität</th>
                <th>Owner</th>
                <th>Support</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((x: any) => (
                <tr key={x.id}>
                  <td>
                    <Link className="linkish" href={`/missing-variables/${encodeURIComponent(x.id)}`}>
                      {x.question}
                    </Link>
                  </td>
                  <td>{x.type}</td>
                  <td>{x.answerKind || "-"}</td>
                  <td>{x.region}</td>
                  <td>{x.trade}</td>
                  <td>{x.priority}</td>
                  <td>{x.ownerId || "-"}</td>
                  <td>{x.supportOwnerId || "-"}</td>
                  <td>{x.status || "offen"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
