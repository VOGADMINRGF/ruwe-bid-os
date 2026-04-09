import { readDb } from "@/lib/db";

export default async function SiteRulesPage() {
  const db = await readDb();
  const rules = db.siteTradeRules || [];
  const sites = db.sites || [];

  return (
    <div className="stack">
      <div>
        <h1 className="h1">Site Rules</h1>
        <p className="sub">Manuell steuerbare Radius- und Gewerkelogik pro Standort.</p>
      </div>
      <div className="card table-wrap">
        <table className="table">
          <thead><tr><th>Standort</th><th>Gewerk</th><th>Priorität</th><th>Primär</th><th>Sekundär</th><th>Keywords</th></tr></thead>
          <tbody>
            {rules.map((r: any) => {
              const site = sites.find((s: any) => s.id === r.siteId);
              return (
                <tr key={r.id}>
                  <td>{site?.name || "-"}</td>
                  <td>{r.trade}</td>
                  <td>{r.priority}</td>
                  <td>{r.primaryRadiusKm} km</td>
                  <td>{r.secondaryRadiusKm} km</td>
                  <td>{(r.keywordsPositive || []).join(", ")}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
