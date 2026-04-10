import { readStore } from "@/lib/storage";
import Link from "next/link";

function n(v: any) {
  const x = Number(v || 0);
  return Number.isFinite(x) ? x : 0;
}

export default async function OpportunitiesPage({
  searchParams
}: {
  searchParams?: Promise<{ sort?: string }>
}) {
  const params = (await searchParams) || {};
  const sort = params.sort || "fit";

  const db = await readStore();
  let rows = Array.isArray(db.opportunities) ? db.opportunities : [];

  rows = [...rows].sort((a: any, b: any) => {
    if (sort === "region") return String(a.region || "").localeCompare(String(b.region || ""));
    if (sort === "trade") return String(a.trade || "").localeCompare(String(b.trade || ""));
    if (sort === "decision") return String(a.decision || "").localeCompare(String(b.decision || ""));
    if (sort === "volume") return n(b.estimatedValue) - n(a.estimatedValue);
    return n(b.fitScore) - n(a.fitScore);
  });

  return (
    <div className="stack">
      <div>
        <h1 className="h1">Opportunities</h1>
        <p className="sub">Normierte Ausschreibungsobjekte mit Priorisierung, Fit-Logik und offener Variablenlage.</p>
      </div>

      <div className="card">
        <div className="toolbar" style={{ marginBottom: 14, display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Link className="button button-secondary" href="/opportunities?sort=fit">Sortierung: Fit</Link>
          <Link className="button button-secondary" href="/opportunities?sort=volume">Volumen</Link>
          <Link className="button button-secondary" href="/opportunities?sort=region">Region</Link>
          <Link className="button button-secondary" href="/opportunities?sort=trade">Gewerk</Link>
          <Link className="button button-secondary" href="/opportunities?sort=decision">Entscheidung</Link>
        </div>

        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Titel</th>
                <th>Region</th>
                <th>Gewerk</th>
                <th>Fit</th>
                <th>Entscheidung</th>
                <th>Kalkulationsmodus</th>
                <th>Offene Variablen</th>
                <th>Owner</th>
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
                    ) : null}
                  </td>
                  <td>{x.region}</td>
                  <td>{x.trade}</td>
                  <td>{x.fitScore ?? "-"}</td>
                  <td>{x.decision}</td>
                  <td>{x.calcMode}</td>
                  <td>{x.missingVariableCount}</td>
                  <td>{x.ownerId}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
