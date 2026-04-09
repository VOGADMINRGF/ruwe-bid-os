import Link from "next/link";
import { readDb } from "@/lib/db";

export default async function SitesPage() {
  const db = await readDb();
  const sites = db.sites || [];
  const rules = db.siteTradeRules || [];

  return (
    <div className="stack">
      <div>
        <h1 className="h1">Sites</h1>
        <p className="sub">Offizielle RUWE-Standorte und Gruppengesellschaften mit Radien und Gewerkelogik.</p>
      </div>
      <div className="card table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Standort</th>
              <th>Typ</th>
              <th>Stadt</th>
              <th>Radius</th>
              <th>Gewerke</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {sites.map((s: any) => {
              const ownRules = rules.filter((r: any) => r.siteId === s.id && r.enabled);
              return (
                <tr key={s.id}>
                  <td>{s.name}</td>
                  <td>{s.type}</td>
                  <td>{s.city}</td>
                  <td>{s.primaryRadiusKm}/{s.secondaryRadiusKm} km</td>
                  <td>{ownRules.map((r: any) => r.trade).join(", ")}</td>
                  <td><Link className="linkish" href={`/sites/${s.id}`}>Öffnen</Link></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
