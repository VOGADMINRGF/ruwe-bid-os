import { toPlain } from "@/lib/serializers";

export function deriveMissingVariables(opportunity: any, parameterMemory: any[] = []) {
  const out: any[] = [];

  const hasRegionalRate = parameterMemory.some((p: any) =>
    p?.type === "regional_rate" &&
    p?.region === opportunity.region &&
    p?.trade === opportunity.trade &&
    p?.status === "defined"
  );

  if (opportunity.estimatedValue <= 0) {
    if (opportunity.calcMode === "stundenmodell" && !hasRegionalRate) {
      out.push({
        id: `mv_${opportunity.id}_regional_rate`,
        opportunityId: opportunity.id,
        type: "regional_rate",
        trade: opportunity.trade,
        region: opportunity.region,
        priority: "hoch",
        question: `Welcher Standard-Stundensatz gilt für ${opportunity.trade} in ${opportunity.region}?`,
        suggestedDefault: null,
        status: "offen"
      });
    }

    if (opportunity.calcMode === "flächenmodell") {
      out.push({
        id: `mv_${opportunity.id}_area_productivity`,
        opportunityId: opportunity.id,
        type: "area_productivity",
        trade: opportunity.trade,
        region: opportunity.region,
        priority: "hoch",
        question: `Welcher Minuten- oder Produktivitätsrichtwert gilt für ${opportunity.trade} in ${opportunity.region}?`,
        suggestedDefault: null,
        status: "offen"
      });
    }

    if (opportunity.calcMode === "unklar") {
      out.push({
        id: `mv_${opportunity.id}_calc_mode`,
        opportunityId: opportunity.id,
        type: "calc_mode",
        trade: opportunity.trade,
        region: opportunity.region,
        priority: "hoch",
        question: `Wie soll diese Ausschreibung kalkulatorisch eingeordnet werden: Stunden, Fläche, Pauschale oder Mischmodell?`,
        suggestedDefault: "prüfen",
        status: "offen"
      });
    }
  }

  if (!opportunity.directLinkValid) {
    out.push({
      id: `mv_${opportunity.id}_direct_link`,
      opportunityId: opportunity.id,
      type: "direct_link",
      trade: opportunity.trade,
      region: opportunity.region,
      priority: "mittel",
      question: `Es fehlt ein belastbarer Direktlink. Soll die Quelle manuell validiert werden?`,
      suggestedDefault: "ja",
      status: "offen"
    });
  }

  if (!opportunity.dueDate) {
    out.push({
      id: `mv_${opportunity.id}_due_date`,
      opportunityId: opportunity.id,
      type: "due_date",
      trade: opportunity.trade,
      region: opportunity.region,
      priority: "mittel",
      question: `Frist unklar. Bitte Fristdatum oder Angebotsfenster prüfen.`,
      suggestedDefault: null,
      status: "offen"
    });
  }

  return toPlain(out);
}
