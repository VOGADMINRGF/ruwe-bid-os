import { readStore } from "@/lib/storage";
import { sourceSummary } from "@/lib/sourceControl";
import SourcesTable from "@/components/sources/SourcesTable";

export default async function SourcesPage() {
  const db = await readStore();
  const rows = sourceSummary(db.sourceRegistry || []);

  return (
    <div className="stack">
      <div>
        <h1 className="h1"><span className="headline-accent">Quellen</span> & Abrufstatus</h1>
        <p className="sub">Welche Plattform wurde wann abgefragt, wie belastbar sind Deep-Links und wie läuft der operative Abruf.</p>
      </div>

      <SourcesTable initialRows={rows} />
    </div>
  );
}
