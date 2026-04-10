import { listConnectors } from "@/lib/connectors";
import ConnectorEditor from "@/components/forms/ConnectorEditor";

export default async function ConnectorsPage() {
  const rows = await listConnectors();

  return (
    <div className="stack">
      <div>
        <h1 className="h1"><span className="headline-accent">Connectoren</span> & Zugänge</h1>
        <p className="sub">Quellen verwalten, Suchfähigkeit markieren und Testläufe durchführen.</p>
      </div>

      <div className="card">
        <ConnectorEditor rows={rows} />
      </div>
    </div>
  );
}
