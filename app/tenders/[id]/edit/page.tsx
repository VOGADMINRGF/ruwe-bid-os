import { notFound } from "next/navigation";
import { readStore } from "@/lib/storage";
import TenderDecisionEditor from "@/components/forms/TenderDecisionEditor";

export default async function EditTenderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = await readStore();
  const tender = (db.tenders || []).find((x: any) => x.id === id);
  if (!tender) return notFound();

  return (
    <div className="stack">
      <div>
        <h1 className="h1">{tender.title}</h1>
        <p className="sub">Entscheidung, Review-Status und Owner bearbeiten.</p>
      </div>
      <div className="card">
        <TenderDecisionEditor tender={tender} />
      </div>
    </div>
  );
}
