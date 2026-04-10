import { listQueryConfig } from "@/lib/queryConfig";
import QueryConfigEditor from "@/components/forms/QueryConfigEditor";

export default async function QueryConfigPage() {
  const rows = await listQueryConfig();

  return (
    <div className="stack">
      <div>
        <h1 className="h1"><span className="headline-accent">Query</span> Konfiguration</h1>
        <p className="sub">Quelle, Gewerk, Region und Suchbegriff als operative Suchmatrix pflegen.</p>
      </div>

      <div className="card">
        <QueryConfigEditor rows={rows} />
      </div>
    </div>
  );
}
