import { readStore, replaceCollection } from "@/lib/storage";
import { toPlain } from "@/lib/serializers";
import { strictDirectLink } from "@/lib/strictLinkValidation";

export async function probeDeepLinks() {
  const db = await readStore();
  const hits = Array.isArray(db.sourceHits) ? db.sourceHits : [];

  let checked = 0;
  let valid = 0;
  let invalid = 0;

  const next = hits.map((hit: any) => {
    checked += 1;
    const assessed = strictDirectLink(hit);
    const ok = assessed.valid === true;

    if (ok) valid += 1;
    else invalid += 1;

    return {
      ...hit,
      externalResolvedUrl: assessed.valid ? assessed.url : null,
      directLinkValid: ok,
      directLinkReason: assessed.reason,
      linkStatus: assessed.status,
      linkLabel: assessed.valid ? "Originalquelle öffnen" : "Kein belastbarer Direktlink",
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
