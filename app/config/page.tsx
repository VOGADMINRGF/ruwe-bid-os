import { readStore } from "@/lib/storage";
import { ensureRolesModel } from "@/lib/roles";

export default async function ConfigPage() {
  await ensureRolesModel();
  const db = await readStore();

  return (
    <div className="stack">
      <div>
        <h1 className="h1">Config</h1>
        <p className="sub">Systemregeln, Bewertungslogik, Quellen und Rollenmodell.</p>
      </div>
      <div className="card">
        <pre className="doc">{JSON.stringify(db.config, null, 2)}</pre>
      </div>
    </div>
  );
}
