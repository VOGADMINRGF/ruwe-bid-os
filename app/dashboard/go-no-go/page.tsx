import { readDb } from "@/lib/db";

export default async function GoNoGoPage() {
  const db = await readDb();
  const tenders = db.tenders || [];
  return (
    <div className="stack">
      <div><h1 className="h1">Go / No-Go</h1><p className="sub">Entscheidungsverteilung der aktuellen Tenders.</p></div>
      <div className="card">
        <pre className="doc">{JSON.stringify({
          go: tenders.filter((t: any) => t.decision === "Go"),
          pruefen: tenders.filter((t: any) => t.decision === "Prüfen"),
          noGo: tenders.filter((t: any) => t.decision === "No-Go")
        }, null, 2)}</pre>
      </div>
    </div>
  );
}
