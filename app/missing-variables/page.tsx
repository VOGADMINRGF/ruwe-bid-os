import { readStore } from "@/lib/storage";
import Link from "next/link";

export default async function MissingVariablesPage({
  searchParams
}: {
  searchParams?: Promise<{ sort?: string }>
}) {
  const params = (await searchParams) || {};
  const sort = params.sort || "priority";

  const db = await readStore();
  let rows = Array.isArray(db.costGaps) ? db.costGaps : [];

  rows = [...rows].sort((a: any, b: any) => {
    if (sort === "region") return String(a.region || "").localeCompare(String(b.region || ""));
    if (sort === "trade") return String(a.trade || "").localeCompare(String(b.trade || ""));
    if (sort === "owner") return String(a.ownerId || "").localeCompare(String(b.ownerId || ""));
    const prio = { hoch: 3, mittel: 2, niedrig: 1 } as Record<string, number>;
    return (prio[b.priority || "niedrig"] || 0) - (prio[a.priority || "niedrig"] || 0);
  });

  return (
    <div className="stack">
      <div>
        <h1 className="h1">Missing Variables</h1>
        <p className="sub">Gezielte Rückfragen für Stunden, Fläche, Frist, Linkvalidität und regionale Standardsätze.</p>
      </div>

      <div className="card">
        <div className="toolbar" style={{ marginBottom: 14, display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Link className="button button-secondary" href="/missing-variables?sort=priority">Priorität</Link>
          <Link className="button button-secondary" href="/missing-variables?sort=region">Region</Link>
          <Link className="button button-secondary" href="/missing-variables?sort=trade">Gewerk</Link>
          <Link className="button button-secondary" href="/missing-variables?sort=owner">Owner</Link>
        </div>

        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Frage</th>
                <th>Typ</th>
                <th>Region</th>
                <th>Gewerk</th>
                <th>Priorität</th>
                <th>Owner</th>
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
                  <td>{x.region}</td>
                  <td>{x.trade}</td>
                  <td>{x.priority}</td>
                  <td>{x.ownerId || "-"}</td>
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
