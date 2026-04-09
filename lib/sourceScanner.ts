import { readStore, replaceCollection } from "@/lib/storage";
import { strictDirectLink } from "@/lib/strictLinkValidation";
import { isAiCandidate } from "@/lib/aiGatekeeper";

function text(v: any) {
  return String(v || "").toLowerCase();
}

function inferTrade(textValue: string) {
  const t = textValue.toLowerCase();
  if (/(unterhaltsreinigung|glasreinigung|reinigung)/.test(t)) return "Reinigung";
  if (/(hausmeister|objektservice)/.test(t)) return "Hausmeister";
  if (/(sicherheit|objektschutz|bewachung|wachdienst)/.test(t)) return "Sicherheit";
  if (/(winterdienst|schnee|glätte)/.test(t)) return "Winterdienst";
  if (/(grünpflege|gruenpflege|garten|landschaft|baum)/.test(t)) return "Grünpflege";
  return "Sonstiges";
}

export async function rescanSourceHits() {
  const db = await readStore();
  const hits = [...(db.sourceHits || [])];

  let invalidLinks = 0;
  let aiBlocked = 0;

  for (let i = 0; i < hits.length; i++) {
    const hit = hits[i];
    const direct = strictDirectLink(hit);
    const inferredTrade =
      hit?.trade && hit.trade !== "Sonstiges"
        ? hit.trade
        : inferTrade(`${hit?.title || ""} ${hit?.description || ""}`);

    const gate = isAiCandidate({
      ...hit,
      trade: inferredTrade,
      directLinkValid: direct.valid,
      externalResolvedUrl: direct.valid ? direct.url : null,
      operationallyUsable: direct.valid
    });

    if (!direct.valid) invalidLinks += 1;
    if (!gate.allowed) aiBlocked += 1;

    hits[i] = {
      ...hit,
      trade: inferredTrade,
      directLinkValid: direct.valid,
      directLinkReason: direct.reason,
      externalResolvedUrl: direct.valid ? direct.url : null,
      operationallyUsable: direct.valid,
      aiEligible: gate.allowed,
      aiBlockedReason: gate.allowed ? null : gate.reason
    };
  }

  await replaceCollection("sourceHits", hits);

  return {
    total: hits.length,
    invalidLinks,
    aiBlocked
  };
}
