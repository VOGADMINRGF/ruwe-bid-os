import { buildOwnerWorkload } from "@/lib/ownerWorkload";

export default async function OwnerWorkloadPage() {
  const rows = await buildOwnerWorkload();

  return (
    <div className="stack">
      <div>
        <h1 className="h1">Owner Workload</h1>
        <p className="sub">Arbeitsverteilung für 4 Koordinatoren und 2 Assistenzen.</p>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Owner</th>
                <th>Opportunities</th>
                <th>Support</th>
                <th>Offene Variablen</th>
                <th>Support Variablen</th>
                <th>Gesamtlast</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((x: any) => (
                <tr key={x.ownerId}>
                  <td>{x.ownerName}</td>
                  <td>{x.opportunitiesOwned}</td>
                  <td>{x.opportunitiesSupport}</td>
                  <td>{x.missingVariablesOwned}</td>
                  <td>{x.missingVariablesSupport}</td>
                  <td>{x.totalLoad}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
