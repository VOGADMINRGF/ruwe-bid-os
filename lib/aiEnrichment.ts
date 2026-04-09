import { readStore, replaceCollection } from "@/lib/storage";
import { classifyExternalLink, sourceDataQuality } from "@/lib/sourceValidity";
import { findBestCostModel, estimateVolumeByCostModel, rememberMissingParameter } from "@/lib/costModels";

function n(v: any) {
  const x = Number(v || 0);
  return Number.isFinite(x) ? x : 0;
}

function inferTradeFromText(text: string) {
  const t = text.toLowerCase();
  if (/(unterhaltsreinigung|glasreinigung|reinigung)/.test(t)) return "Reinigung";
  if (/(hausmeister|objektservice)/.test(t)) return "Hausmeister";
  if (/(sicherheit|objektschutz|bewachung|wach)/.test(t)) return "Sicherheit";
  if (/(winterdienst|schnee|glätte)/.test(t)) return "Winterdienst";
  if (/(grünpflege|gruenpflege|garten|landschaft|baum)/.test(t)) return "Grünpflege";
  return "Sonstiges";
}

export async function enrichSourceHitsForValidityAndEstimation() {
  const db = await readStore();
  const hits = [...(db.sourceHits || [])];
  const registry = db.sourceRegistry || [];
  const models = Array.isArray(db.costModels) ? db.costModels : [];

  let changed = 0;
  let missingCostGaps = 0;

  for (let i = 0; i < hits.length; i++) {
    const hit = hits[i];
    const link = classifyExternalLink(hit, registry);
    const text = `${hit?.title || ""} ${hit?.description || ""}`;
    const inferredTrade = !hit?.trade || hit?.trade === "Sonstiges" ? inferTradeFromText(text) : hit.trade;
    const quality = sourceDataQuality({ ...hit, trade: inferredTrade });

    let next = {
      ...hit,
      trade: inferredTrade,
      linkStatus: link.linkStatus,
      linkLabel: link.linkLabel,
      externalResolvedUrl: link.url,
      sourceQuality: quality.quality,
      sourceQualityReasons: quality.reasons
    };

    if (!n(next.estimatedValue)) {
      const model = findBestCostModel(models as any, next.region, next.trade);
      const estimation = estimateVolumeByCostModel(next, model as any);

      next = {
        ...next,
        estimatedValue: estimation.estimatedValue,
        estimationStatus: estimation.estimationStatus,
        estimationNote: estimation.estimationNote,
        costModelId: estimation.costModelId || null
      };

      if (estimation.estimationStatus === "missing_cost_model") {
        await rememberMissingParameter(next, "cost_model", `Kein Kostenmodell für ${next.region} / ${next.trade}`);
        missingCostGaps += 1;
      }
    }

    hits[i] = next;
    changed += 1;
  }

  await replaceCollection("sourceHits", hits);
  return { changed, missingCostGaps };
}
