import { buildOwnerWorkload } from "@/lib/ownerWorkload";

export default async function OwnerWorkloadWidget() {
  const rows = await buildOwnerWorkload();
  const top = rows.slice(0, 6);

  return (
    <div className="card">
      <div className="section-title">Owner-Last</div>
      <div className="table-wrap" style={{ marginTop: 14 }}>
        <table className="table">
          <thead>
            <tr>
              <th>Owner</th>
              <th>Last</th>
            </tr>
          </thead>
          <tbody>
            {top.map((x: any) => (
              <tr key={x.ownerId}>
                <td>{x.ownerName}</td>
                <td>{x.totalLoad}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
