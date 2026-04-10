import { readStore, replaceCollection } from "@/lib/storage";
import { scoreOpportunityFit } from "@/lib/fitScoring";
import { toPlain } from "@/lib/serializers";

export async function enrichOpportunitiesWithFit() {
  const db = await readStore();
  const rows = Array.isArray(db.opportunities) ? db.opportunities : [];
  const learningRules = Array.isArray(db.learningRules) ? db.learningRules : [];

  const next = [];
  for (const row of rows) {
    const fit = await scoreOpportunityFit(row);
    const similarLearning = learningRules.filter((x: any) =>
      (x?.trade ? x.trade === row.trade : true) &&
      (x?.region ? x.region === row.region : true)
    );
    const hasPromote = similarLearning.some((x: any) => x.action === "promote_bid");
    const hasDemote = similarLearning.some((x: any) => x.action === "demote_no_bid");

    let decision = String(row.decision || "");
    if (hasPromote && (decision === "No-Bid" || decision === "No-Go")) decision = "Prüfen";
    if (hasDemote && decision === "Bid") decision = "Prüfen";

    const noBidReason =
      decision === "No-Go" || decision === "No-Bid"
        ? (
            row.noBidReason ||
            `${fit.shortReason} ${fit.detailedReasons.slice(0, 2).join(" ")}`
          ).trim()
        : row.noBidReason || "";

    next.push({
      ...row,
      decision,
      fitScore: Math.round((Number(row.fitScore ?? fit.score) + Number(fit.score)) / 2),
      fitBucket: row.fitBucket || fit.bucket,
      fitReasonShort: row.fitReasonShort || fit.shortReason,
      fitReasonList: Array.from(new Set([
        ...(row.fitReasonList || []),
        ...fit.detailedReasons,
        ...(hasPromote ? ["Lernregel stärkt ähnliche Fälle und verhindert vorschnelles Aussortieren."] : []),
        ...(hasDemote ? ["Lernregel dämpft aggressive Bid-Freigabe bei ähnlichen Fällen."] : [])
      ])).slice(0, 6),
      noBidReason
    });
  }

  await replaceCollection("opportunities", toPlain(next) as any);
  return toPlain({ changed: next.length });
}
