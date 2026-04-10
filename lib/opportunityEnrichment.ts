import { readStore, replaceCollection } from "@/lib/storage";
import { scoreOpportunityFit } from "@/lib/fitScoring";
import { toPlain } from "@/lib/serializers";

export async function enrichOpportunitiesWithFit() {
  const db = await readStore();
  const rows = Array.isArray(db.opportunities) ? db.opportunities : [];

  const next = [];
  for (const row of rows) {
    const fit = await scoreOpportunityFit(row);

    const noBidReason =
      row.decision === "No-Go" || row.decision === "No-Bid"
        ? `${fit.shortReason} ${fit.detailedReasons.slice(0, 1).join(" ")}`
        : row.noBidReason || "";

    next.push({
      ...row,
      fitScore: fit.score,
      fitBucket: fit.bucket,
      fitReasonShort: fit.shortReason,
      fitReasonList: fit.detailedReasons,
      noBidReason
    });
  }

  await replaceCollection("opportunities", toPlain(next) as any);
  return toPlain({ changed: next.length });
}
