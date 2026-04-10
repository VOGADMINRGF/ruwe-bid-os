import { runAllPhases } from "@/lib/runAllPhased";
import { readStore } from "@/lib/storage";
import { toPlain } from "@/lib/serializers";

export async function runOperationalHardening() {
  const run = await runAllPhases();
  const db = await readStore();

  return toPlain({
    ok: run.ok,
    phases: run.phases,
    summary: {
      ...(run.summary || {}),
      opportunities: Array.isArray(db.opportunities) ? db.opportunities.length : 0,
      missingVariables: Array.isArray(db.costGaps) ? db.costGaps.length : 0
    }
  });
}
