import Link from "next/link";
import { readDb } from "@/lib/db";

export default async function SitesPage() {
  const db = await readDb();
  const items = db.sites || [];
  const rules = db.siteTradeRules || [];

  return (
    <div className="stack">
      <div>
        <h1 className="h1">Sites</h1>
        <p className="sub">RUWE-Standorte mit Primär-/Sekundärradius und aktiven Gewerken.</p>
      </div>
      <div className="card table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Standort</th>
              <th>Stadt</th>
              <th>Primär / Sekundär</th>
              <th>Gewerke</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item: any) => {
              const ownRules = rules.filter((r: any) => r.siteId === item.id && r.enabled);
              return (
                <tr key={item.id}>
                  <td>{item.name}</td>
                  <td>{item.city}</td>
                  <td>{item.primaryRadiusKm} / {item.secondaryRadiusKm} km</td>
                  <td>{ownRules.map((r: any) => r.trade).join(", ")}</td>
                  <td><Link className="linkish" href={`/sites/${item.id}`}>Öffnen</Link></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
