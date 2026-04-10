import { toPlain } from "@/lib/serializers";

export function buildProposalWorkbench(detail: any) {
  const opp = detail?.opportunity;
  const vars = Array.isArray(detail?.missingVariables) ? detail.missingVariables : [];
  const params = Array.isArray(detail?.parameterMemory) ? detail.parameterMemory : [];
  const hit = detail?.sourceHit;

  if (!opp) return null;

  const openVars = vars.filter((x: any) => x.status !== "beantwortet");
  const answeredVars = vars.filter((x: any) => x.status === "beantwortet");

  const availableRegionalParams = params.filter((x: any) =>
    x.status === "defined" &&
    ((x.region && x.region === opp.region) || (x.trade && x.trade === opp.trade))
  );

  let workbenchStatus = "Vorprüfung";
  if (opp.decision === "Bid" && openVars.length === 0) workbenchStatus = "Angebot vorbereitbar";
  else if (opp.decision === "Bid" && openVars.length > 0) workbenchStatus = "Parameter fehlen";
  else if (opp.decision === "Prüfen") workbenchStatus = "Review nötig";
  else if (opp.decision === "No-Bid" || opp.decision === "No-Go") workbenchStatus = "derzeit nicht priorisiert";

  const nextAction =
    openVars.length > 0
      ? openVars[0].question
      : opp.nextStep
      ? opp.nextStep
      : opp.decision === "Bid"
      ? "Angebotsstruktur und Kalkulation vorbereiten."
      : "Fall beobachten oder Entscheidung dokumentieren.";

  return toPlain({
    workbenchStatus,
    nextAction,
    metrics: {
      openVariables: openVars.length,
      answeredVariables: answeredVars.length,
      parameterCount: availableRegionalParams.length,
      directLinkValid: opp.directLinkValid === true,
      estimatedValue: opp.estimatedValue || 0,
      durationMonths: opp.durationMonths || 0
    },
    blocks: {
      tenderSummary: {
        title: opp.title,
        region: opp.region,
        trade: opp.trade,
        decision: opp.decision,
        calcMode: opp.calcMode,
        stage: opp.stage,
        dueDate: opp.dueDate || "-",
        directLink: opp.directLinkValid === true
          ? (opp.externalResolvedUrl || hit?.externalResolvedUrl || null)
          : null
      },
      variables: openVars,
      parameters: availableRegionalParams,
      notes: detail?.notes || []
    }
  });
}
