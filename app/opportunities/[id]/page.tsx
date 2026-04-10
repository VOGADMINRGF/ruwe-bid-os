import Link from "next/link";
import { getOpportunityDetail } from "@/lib/opportunityDetail";
import { buildProposalWorkbench } from "@/lib/proposalWorkbench";
import OpportunityStatusForm from "@/components/forms/OpportunityStatusForm";
import OpportunityNoteForm from "@/components/forms/OpportunityNoteForm";
import OpportunityOverrideForm from "@/components/forms/OpportunityOverrideForm";
import { formatCurrencyCompact } from "@/lib/numberFormat";

export default async function OpportunityDetailPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params;
  const detail = await getOpportunityDetail(id);

  if (!detail) {
    return (
      <div className="stack">
        <h1 className="h1">Opportunity nicht gefunden</h1>
      </div>
    );
  }

  const workbench = buildProposalWorkbench(detail);
  const opp = detail.opportunity;

  return (
    <div className="stack">
      <div>
        <h1 className="h1">Opportunity Workbench</h1>
        <p className="sub">Ausschreibung verstehen, Variablen klären, Kalkulationsbasis herstellen und Angebot vorbereiten.</p>
      </div>

      <div className="grid grid-2">
        <div className="card">
          <div className="section-title">Ausschreibung</div>
          <div className="meta" style={{ marginTop: 14 }}>Titel: {opp.title}</div>
          <div className="meta">Region: {opp.region}</div>
          <div className="meta">Gewerk: {opp.trade}</div>
          <div className="meta">Entscheidung: {opp.decision}</div>
          <div className="meta">Stage: {opp.stage}</div>
          <div className="meta">Kalkulationsmodus: {opp.calcMode}</div>
          <div className="meta">Volumen: {formatCurrencyCompact(opp.estimatedValue || 0)}</div>
          <div className="meta">Laufzeit: {opp.durationMonths || 0} Mon.</div>
          <div className="meta">Frist: {opp.dueDate || "-"}</div>
          <div className="meta">Owner: {opp.ownerId || "-"}</div>
          <div className="meta">Assistenz: {opp.supportOwnerId || "-"}</div>
          <div className="meta">
            Direktlink:{" "}
            {workbench?.blocks?.tenderSummary?.directLink ? (
              <Link className="linkish" href={String(workbench.blocks.tenderSummary.directLink)} target="_blank">
                Quelle öffnen
              </Link>
            ) : (
              "nicht vorhanden"
            )}
          </div>
        </div>

        <div className="card">
          <div className="section-title">Arbeitsstatus</div>
          <div className="meta" style={{ marginTop: 14 }}>Workbench-Status: {workbench?.workbenchStatus}</div>
          <div className="meta">Nächste Aktion: {workbench?.nextAction}</div>
          <div className="meta">Offene Variablen: {workbench?.metrics?.openVariables}</div>
          <div className="meta">Beantwortet: {workbench?.metrics?.answeredVariables}</div>
          <div className="meta">Parameter vorhanden: {workbench?.metrics?.parameterCount}</div>
          <div className="meta">Direktlink valide: {workbench?.metrics?.directLinkValid ? "ja" : "nein"}</div>
          <div className="meta">Fit-Score: {opp.fitScore ?? "-"}</div>
          <div className="meta">Fit-Einschätzung: {opp.fitReasonShort || "-"}</div>
        </div>
      </div>

      <div className="grid grid-3">
        <OpportunityStatusForm id={opp.id} currentStage={opp.stage} currentDecision={opp.decision} />
        <OpportunityOverrideForm id={opp.id} currentDecision={opp.decision} />
        <OpportunityNoteForm id={opp.id} />
      </div>

      <div className="grid grid-2">
        <div className="card">
          <div className="section-title">Offene Variablen</div>
          <div className="table-wrap" style={{ marginTop: 14 }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Frage</th>
                  <th>Typ</th>
                  <th>Priorität</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {(detail.missingVariables || []).map((x: any) => (
                  <tr key={x.id}>
                    <td>{x.question}</td>
                    <td>{x.type}</td>
                    <td>{x.priority}</td>
                    <td>{x.status || "offen"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <div className="section-title">Passende Parameter</div>
          <div className="table-wrap" style={{ marginTop: 14 }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Typ</th>
                  <th>Region</th>
                  <th>Gewerk</th>
                  <th>Wert</th>
                </tr>
              </thead>
              <tbody>
                {(detail.parameterMemory || []).map((x: any, i: number) => (
                  <tr key={x.id || i}>
                    <td>{x.type}</td>
                    <td>{x.region || "-"}</td>
                    <td>{x.trade || "-"}</td>
                    <td>{x.value ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="section-title">Notizen</div>
        <div className="table-wrap" style={{ marginTop: 14 }}>
          <table className="table">
            <thead>
              <tr>
                <th>Zeit</th>
                <th>Autor</th>
                <th>Text</th>
              </tr>
            </thead>
            <tbody>
              {(detail.notes || []).map((x: any) => (
                <tr key={x.id}>
                  <td>{x.createdAt}</td>
                  <td>{x.author}</td>
                  <td>{x.text}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
