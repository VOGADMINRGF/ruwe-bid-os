import { readStore, replaceCollection } from "@/lib/storage";
import { strictDirectLink } from "@/lib/strictLinkValidation";
import { upsertParameterMemory, findParameter } from "@/lib/parameterMemory";
import { normalizeRegionFromHit } from "@/lib/regionNormalization";
import { classifyTrade, detectCalcMode } from "@/lib/tradeClassification";

function n(v: any) {
  const x = Number(v || 0);
  return Number.isFinite(x) ? x : 0;
}

function inferTrade(text: string) {
  const t = text.toLowerCase();
  if (/(unterhaltsreinigung|glasreinigung|reinigung)/.test(t)) return "Reinigung";
  if (/(hausmeister|objektservice)/.test(t)) return "Hausmeister";
  if (/(sicherheit|objektschutz|bewachung|wachdienst)/.test(t)) return "Sicherheit";
  if (/(winterdienst|schnee|glätte)/.test(t)) return "Winterdienst";
  if (/(grünpflege|gruenpflege|garten|landschaft|baum)/.test(t)) return "Grünpflege";
  return "Sonstiges";
}

function extractSpecs(text: string) {
  const specs: Record<string, any> = {};

  const sqm = text.match(/(\d{2,6})\s*(m²|qm|m2)/i);
  if (sqm) specs.areaSqm = Number(sqm[1]);

  const months = text.match(/(\d{1,3})\s*(monate|monat|mon\.)/i);
  if (months) specs.durationMonths = Number(months[1]);

  const hours = text.match(/(\d{2,5})\s*(stunden|std\.)/i);
  if (hours) specs.hours = Number(hours[1]);

  const los = text.match(/los\s*(\d+)/i);
  if (los) specs.lot = los[1];

  return specs;
}

export async function enrichHitsStrictAndLearn() {
  const db = await readStore();
  const hits = [...(db.sourceHits || [])];
  let changed = 0;

  for (let i = 0; i < hits.length; i++) {
    const hit = hits[i];
    const text = `${hit?.title || ""} ${hit?.description || ""}`;
    const inferredTrade = hit?.trade && hit.trade !== "Sonstiges" ? hit.trade : inferTrade(text);
    const tradeNormalized = classifyTrade({ ...hit, trade: inferredTrade, title: hit?.title, description: hit?.description });
    const regionNormalized = normalizeRegionFromHit(hit);
    const regionRaw = String(hit?.regionRaw || hit?.region || hit?.city || "");
    const calcMode = detectCalcMode({ title: hit?.title, aiReason: hit?.aiReason, aiSummary: hit?.description });
    const specs = extractSpecs(text);
    const direct = strictDirectLink(hit);

    let estimatedValue = n(hit?.estimatedValue);
    let estimationStatus = hit?.estimationStatus || null;
    let estimationNote = hit?.estimationNote || null;

    if (!estimatedValue) {
      const rate = await findParameter(hit?.region || "Unbekannt", inferredTrade, "cost", "default_rate");
      if (rate && rate.value) {
        const duration = specs.durationMonths || n(hit?.durationMonths) || 12;

        if (inferredTrade === "Reinigung" && specs.areaSqm) {
          estimatedValue = Math.round(Number(rate.value) * Number(specs.areaSqm) * duration);
          estimationStatus = "estimated_from_parameter_memory";
          estimationNote = `Volumen aus Flächenlogik und bestätigtem Kostenparameter geschätzt.`;
        } else if (inferredTrade === "Sicherheit") {
          const baseHours = specs.hours || (160 * duration);
          estimatedValue = Math.round(Number(rate.value) * baseHours);
          estimationStatus = "estimated_from_parameter_memory";
          estimationNote = `Volumen aus Stundenlogik und bestätigtem Kostenparameter geschätzt.`;
        } else if (["Hausmeister", "Winterdienst", "Grünpflege"].includes(inferredTrade)) {
          estimatedValue = Math.round(Number(rate.value) * duration);
          estimationStatus = "estimated_from_parameter_memory";
          estimationNote = `Volumen aus Monatslogik und bestätigtem Kostenparameter geschätzt.`;
        }
      } else {
        await upsertParameterMemory({
          region: regionNormalized || hit?.region || "Unbekannt",
          trade: inferredTrade,
          parameterType: "cost",
          parameterKey: "default_rate",
          value: null,
          unit: inferredTrade === "Reinigung" ? "€/qm_monat" : inferredTrade === "Sicherheit" ? "€/stunde" : "€/monat_objekt",
          status: "open",
          source: "hit_enrichment",
          note: `Für ${inferredTrade} in ${hit?.region || "Unbekannt"} fehlt bestätigter Kostenparameter.`
        });
      }
    }

    hits[i] = {
      ...hit,
      region: regionNormalized || hit?.region || "Unbekannt",
      regionRaw,
      regionNormalized,
      trade: tradeNormalized,
      tradeRaw: String(hit?.tradeRaw || hit?.trade || inferredTrade),
      tradeNormalized,
      extractedSpecs: specs,
      directLinkValid: direct.valid,
      directLinkReason: direct.reason,
      linkStatus: direct.status,
      linkLabel: direct.valid ? "Originalquelle öffnen" : "Kein belastbarer Direktlink",
      externalResolvedUrl: direct.valid ? direct.url : null,
      estimatedValue,
      estimationStatus,
      estimationNote,
      calcMode,
      operationallyUsable: direct.valid
    };
    changed += 1;
  }

  await replaceCollection("sourceHits", hits);
  return { changed };
}
