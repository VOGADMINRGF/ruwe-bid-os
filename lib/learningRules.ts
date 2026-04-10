import { readStore, replaceCollection } from "@/lib/storage";
import { toPlain } from "@/lib/serializers";

export async function listLearningRules() {
  const db = await readStore();
  return toPlain(Array.isArray((db as any).learningRules) ? (db as any).learningRules : []);
}

export async function addLearningRule(input: any) {
  const db = await readStore();
  const rows = Array.isArray((db as any).learningRules) ? (db as any).learningRules : [];

  const entry = {
    id: `lr_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    trade: input.trade || null,
    region: input.region || null,
    action: input.action || "promote_bid",
    reason: input.reason || "",
    createdAt: new Date().toISOString()
  };

  await replaceCollection("learningRules" as any, [...rows, entry] as any);
  return toPlain(entry);
}
