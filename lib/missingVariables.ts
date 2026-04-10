import { toPlain } from "@/lib/serializers";

function withAnswerMeta(base: Record<string, any>, extra: Record<string, any>) {
  return {
    ...base,
    answerKind: extra.answerKind || "text",
    answerUnit: extra.answerUnit || null,
    answerOptions: Array.isArray(extra.answerOptions) ? extra.answerOptions : null,
    answerPattern: extra.answerPattern || null,
    answerPlaceholder: extra.answerPlaceholder || ""
  };
}

export function deriveMissingVariables(opportunity: any, parameterMemory: any[] = []) {
  const out: any[] = [];
  const calcMode = String(opportunity?.calcMode || "").toLowerCase();

  const hasRegionalRate = parameterMemory.some((p: any) =>
    p?.type === "regional_rate" &&
    p?.region === opportunity.region &&
    p?.trade === opportunity.trade &&
    p?.status === "defined"
  );

  if (opportunity.estimatedValue <= 0) {
    if ((calcMode === "stunden" || calcMode === "turnus") && !hasRegionalRate) {
      out.push(withAnswerMeta({
        id: `mv_${opportunity.id}_regional_rate`,
        opportunityId: opportunity.id,
        type: "regional_rate",
        trade: opportunity.trade,
        region: opportunity.region,
        priority: "hoch",
        question: `Welcher Standard-Stundensatz gilt für ${opportunity.trade} in ${opportunity.region}?`,
        suggestedDefault: null,
        status: "offen"
      }, {
        answerKind: "stundensatz",
        answerUnit: "EUR/h",
        answerPattern: "^\\d+(?:[\\.,]\\d{1,2})?$",
        answerPlaceholder: "z. B. 42,50"
      }));
    }

    if (calcMode === "fläche" || calcMode === "flaeche") {
      out.push(withAnswerMeta({
        id: `mv_${opportunity.id}_area_productivity`,
        opportunityId: opportunity.id,
        type: "area_productivity",
        trade: opportunity.trade,
        region: opportunity.region,
        priority: "hoch",
        question: `Welcher Minuten- oder Produktivitätsrichtwert gilt für ${opportunity.trade} in ${opportunity.region}?`,
        suggestedDefault: null,
        status: "offen"
      }, {
        answerKind: "zahl",
        answerUnit: "min/100m²",
        answerPattern: "^\\d+(?:[\\.,]\\d{1,2})?$",
        answerPlaceholder: "z. B. 18"
      }));
    }

    if (calcMode === "unklar" || calcMode === "mischmodell") {
      out.push(withAnswerMeta({
        id: `mv_${opportunity.id}_calc_mode`,
        opportunityId: opportunity.id,
        type: "calc_mode",
        trade: opportunity.trade,
        region: opportunity.region,
        priority: "hoch",
        question: `Wie soll diese Ausschreibung kalkulatorisch eingeordnet werden: Stunden, Fläche, Pauschale oder Mischmodell?`,
        suggestedDefault: "prüfen",
        status: "offen"
      }, {
        answerKind: "kalkulationsmodus",
        answerOptions: ["Stunden", "Fläche", "Turnus", "Pauschale", "Mischmodell", "unklar"]
      }));
    }
  }

  if (!opportunity.directLinkValid) {
    out.push(withAnswerMeta({
      id: `mv_${opportunity.id}_direct_link`,
      opportunityId: opportunity.id,
      type: "direct_link",
      trade: opportunity.trade,
      region: opportunity.region,
      priority: "mittel",
      question: `Es fehlt ein belastbarer Direktlink. Soll die Quelle manuell validiert werden?`,
      suggestedDefault: "ja",
      status: "offen"
    }, {
      answerKind: "ja_nein",
      answerOptions: ["ja", "nein"]
    }));
  }

  if (!opportunity.dueDate) {
    out.push(withAnswerMeta({
      id: `mv_${opportunity.id}_due_date`,
      opportunityId: opportunity.id,
      type: "due_date",
      trade: opportunity.trade,
      region: opportunity.region,
      priority: "mittel",
      question: `Frist unklar. Bitte Fristdatum oder Angebotsfenster prüfen.`,
      suggestedDefault: null,
      status: "offen"
    }, {
      answerKind: "laufzeit",
      answerPattern: "^\\d{4}-\\d{2}-\\d{2}$",
      answerPlaceholder: "YYYY-MM-DD"
    }));
  }

  if (!opportunity.buyer) {
    out.push(withAnswerMeta({
      id: `mv_${opportunity.id}_buyer`,
      opportunityId: opportunity.id,
      type: "buyer",
      trade: opportunity.trade,
      region: opportunity.region,
      priority: "mittel",
      question: "Vergabestelle/Auftraggeber unklar. Bitte Auftraggeber ergänzen.",
      suggestedDefault: null,
      status: "offen"
    }, {
      answerKind: "text",
      answerPlaceholder: "z. B. Bezirksamt ..."
    }));
  }

  return toPlain(out);
}
