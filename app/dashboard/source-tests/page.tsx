import { readStore } from "@/lib/storage";
import { sourceHealth, sourceUsefulnessScore } from "@/lib/sourceLogic";

export default async function SourceTestsPage() {
  const db = await readStore();
  const registry = db.sourceRegistry || [];
  const stats = db.sourceStats || [];

  const rows = registry.map((src: any) => {
    const stat = stats.find((s: any) => s.id === src.id) || {};
    return {
      ...src,
      ...stat,
      health: sourceHealth(stat),
      usefulnessScore: sourceUsefulnessScore(stat)
    };
  });

  return (
    <div className="stack">
      <div>
        <h1 className="h1">Source Tests</h1>
        <p className="sub">Übersicht, welche Quellen erfolgreich sind und wie sinnvoll sie für RUWE wirken.</p>
      </div>
      <div className="card">
        <pre className="doc">{JSON.stringify(rows, null, 2)}</pre>
      </div>
    </div>
  );
}
