import Link from "next/link";
import { readStore } from "@/lib/storage";

export default async function SitesPage() {
  const db = await readStore();
  const sites = db.sites || [];
  const rules = db.siteTradeRules || [];

  return (
    <div className="stack">
      <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 className="h1">Betriebshöfe & Niederlassungen</h1>
          <p className="sub">Aktive Betriebshöfe und Niederlassungen mit Radius-, Gewerk- und Regelsteuerung.</p>
        </div>
        <Link className="button" href="/sites/new">Neuer Betriebshof</Link>
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
