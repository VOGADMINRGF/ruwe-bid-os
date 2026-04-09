import { readDb } from "@/lib/db";

export default async function ServiceAreasPage() {
  const db = await readDb();
  const items = db.serviceAreas || [];
  const sites = db.sites || [];

  return (
    <div className="stack">
      <div>
        <h1 className="h1">Service Areas</h1>
        <p className="sub">Operative Einsatzräume zusätzlich zu den formalen Standorten.</p>
      </div>
      <div className="card table-wrap">
        <table className="table">
          <thead><tr><th>Name</th><th>Standort</th><th>Bundesland</th><th>Aktiv</th></tr></thead>
          <tbody>
            {items.map((x: any) => {
              const site = sites.find((s: any) => s.id === x.siteId);
              return (
                <tr key={x.id}>
                  <td>{x.name}</td>
                  <td>{site?.name || "-"}</td>
                  <td>{x.state}</td>
                  <td>{x.active ? "Ja" : "Nein"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
