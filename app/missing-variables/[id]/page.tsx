import Link from "next/link";
import { getMissingVariableDetail } from "@/lib/missingVariableDetail";
import MissingVariableAnswerForm from "@/components/forms/MissingVariableAnswerForm";

export default async function MissingVariableDetailPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params;
  const detail = await getMissingVariableDetail(id);

  if (!detail) {
    return (
      <div className="stack">
        <h1 className="h1">Variable nicht gefunden</h1>
      </div>
    );
  }

  const v = detail.variable;
  const opp = detail.opportunity;

  return (
    <div className="stack">
      <div>
        <h1 className="h1">Missing Variable</h1>
        <p className="sub">Gezielte Beantwortung offener Kalkulations- und Ausschreibungsparameter.</p>
      </div>

      <div className="grid grid-2">
        <div className="card">
          <div className="section-title">Variable</div>
          <div className="meta" style={{ marginTop: 14 }}>Frage: {v.question}</div>
          <div className="meta">Typ: {v.type}</div>
          <div className="meta">Antworttyp: {v.answerKind || "-"}</div>
          <div className="meta">Einheit: {v.answerUnit || "-"}</div>
          <div className="meta">Region: {v.region}</div>
          <div className="meta">Gewerk: {v.trade}</div>
          <div className="meta">Priorität: {v.priority}</div>
          <div className="meta">Status: {v.status || "offen"}</div>
          <div className="meta">Owner: {v.ownerId || "-"}</div>
          <div className="meta">Support: {v.supportOwnerId || "-"}</div>
          <div className="meta">Beantwortet am: {v.answeredAt || "-"}</div>
        </div>

        <MissingVariableAnswerForm
          id={v.id}
          question={v.question}
          answerKind={v.answerKind}
          answerOptions={v.answerOptions}
          answerPlaceholder={v.answerPlaceholder}
          answerUnit={v.answerUnit}
        />
      </div>

      {opp ? (
        <div className="card">
          <div className="section-title">Zugehörige Opportunity</div>
          <div className="meta" style={{ marginTop: 14 }}>
            <Link className="linkish" href={`/opportunities/${encodeURIComponent(opp.id)}`}>
              {opp.title}
            </Link>
          </div>
          <div className="meta">Region: {opp.region}</div>
          <div className="meta">Gewerk: {opp.trade}</div>
          <div className="meta">Entscheidung: {opp.decision}</div>
          <div className="meta">Kalkulationsmodus: {opp.calcMode}</div>
        </div>
      ) : null}

      <div className="card">
        <div className="section-title">Ähnliche Parameter</div>
        <div className="table-wrap" style={{ marginTop: 14 }}>
          <table className="table">
            <thead>
              <tr>
                <th>Typ</th>
                <th>Region</th>
                <th>Gewerk</th>
                <th>Wert</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {(detail.matchingParams || []).map((x: any, i: number) => (
                <tr key={x.id || i}>
                  <td>{x.type}</td>
                  <td>{x.region || "-"}</td>
                  <td>{x.trade || "-"}</td>
                  <td>{x.value ?? "-"}</td>
                  <td>{x.status || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
