import { readDb } from "@/lib/db";
import { siteCoverage } from "@/lib/siteLogic";

export default async function CoveragePage() {
  const db = await readDb();
  const coverage = siteCoverage(db.sites || [], db.siteTradeRules || [], db.tenders || []);
  return (
    <div className="stack">
      <div><h1 className="h1">Coverage</h1><p className="sub">Abdeckung über aktive Sites und Regeln.</p></div>
      <div className="card">
        <pre className="doc">{JSON.stringify(coverage, null, 2)}</pre>
      </div>
    </div>
  );
}
