import { notFound } from "next/navigation";
import { getParameterRow } from "@/lib/parameterLearning";
import ParameterRowEditor from "@/components/forms/ParameterRowEditor";

export default async function ParameterDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const row = await getParameterRow(id);

  if (!row) notFound();

  return (
    <div className="stack">
      <div>
        <h1 className="h1"><span className="headline-accent">Parameter</span> bearbeiten</h1>
        <p className="sub">Regionale Lern- und Kalkulationsbasis für künftige Ausschreibungen.</p>
      </div>

      <div className="card">
        <div className="section-title">{row.region} · {row.trade}</div>
        <div style={{ marginTop: 16 }}>
          <ParameterRowEditor row={row} />
        </div>
      </div>
    </div>
  );
}
