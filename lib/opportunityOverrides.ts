import { readStore, replaceCollection } from "@/lib/storage";
import { toPlain } from "@/lib/serializers";
import { addLearningRule } from "@/lib/learningRules";
import { appendAuditLog } from "@/lib/auditLog";

export async function overrideOpportunity(id: string, body: any) {
  const db = await readStore();
  const rows = Array.isArray(db.opportunities) ? db.opportunities : [];

  let updated: any = null;
  const next = rows.map((x: any) => {
    if (x.id !== id) return x;
    updated = {
      ...x,
      decision: body.decision || x.decision,
      overrideReason: body.reason || "",
      overrideAt: new Date().toISOString(),
      overrideBy: body.by || "admin"
    };
    return updated;
  });

  await replaceCollection("opportunities", next as any);

  if (updated && body.learn === true) {
    await addLearningRule({
      trade: updated.trade,
      region: updated.region,
      action: body.decision === "Bid" ? "promote_bid" : "demote_no_bid",
      reason: body.reason || `Aus Override für ${updated.title}`
    });
  }

  if (updated) {
    await appendAuditLog({
      actor: body.by || "admin",
      action: "opportunity.override",
      entityType: "opportunity",
      entityId: updated.id,
      details: {
        decision: updated.decision,
        reason: updated.overrideReason || "",
        learn: body.learn === true
      }
    });
  }

  return toPlain(updated);
}
