import { readStore, replaceCollection } from "@/lib/storage";
import { toPlain } from "@/lib/serializers";

function isValidDirectUrl(url: any) {
  return typeof url === "string" && /^https?:\/\//i.test(url);
}

export async function probeDeepLinks() {
  const db = await readStore();
  const hits = Array.isArray(db.sourceHits) ? db.sourceHits : [];

  let checked = 0;
  let valid = 0;
  let invalid = 0;

  const next = hits.map((hit: any) => {
    checked += 1;

    const resolved =
      isValidDirectUrl(hit?.externalResolvedUrl) ? hit.externalResolvedUrl :
      isValidDirectUrl(hit?.url) ? hit.url :
      null;

    const ok = !!resolved;

    if (ok) valid += 1;
    else invalid += 1;

    return {
      ...hit,
      externalResolvedUrl: resolved,
      directLinkValid: ok,
      directLinkReason: ok ? "Direktlink vorhanden" : "Kein belastbarer Direktlink",
      operationallyUsable: ok ? (hit?.operationallyUsable !== false) : false
    };
  });

  await replaceCollection("sourceHits", toPlain(next));

  return toPlain({
    checked,
    valid,
    invalid
  });
}
