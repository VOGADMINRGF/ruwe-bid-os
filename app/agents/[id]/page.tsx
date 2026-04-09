import { notFound } from "next/navigation";
import { readDb } from "@/lib/db";

export default async function AgentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = await readDb();
  const item = (db.agents || []).find((x: any) => x.id === id);
  if (!item) return notFound();

  return (
    <div className="stack">
      <div>
        <h1 className="h1">{item.name}</h1>
        <p className="sub">Detailansicht des Agenten.</p>
      </div>
      <div className="card">
        <pre className="doc">{JSON.stringify(item, null, 2)}</pre>
      </div>
    </div>
  );
}
