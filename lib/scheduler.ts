import { readStore, replaceCollection } from "@/lib/storage";
import { runAllPhases } from "@/lib/runAllPhased";
import { appendAuditLog } from "@/lib/auditLog";

function n(v: any, fallback: number) {
  const x = Number(v);
  return Number.isFinite(x) ? x : fallback;
}

export async function schedulerTick() {
  const db = await readStore();
  const meta = db.meta || {};
  const now = Date.now();
  const intervalMinutes = n(meta.schedulerIntervalMinutes, 60);
  const lastTs = meta.lastSchedulerRunAt ? new Date(meta.lastSchedulerRunAt).getTime() : 0;
  const due = !lastTs || now - lastTs >= intervalMinutes * 60_000;

  if (!due) {
    return {
      ok: true,
      ran: false,
      due: false,
      intervalMinutes,
      nextInMinutes: Math.max(1, Math.ceil((intervalMinutes * 60_000 - (now - lastTs)) / 60_000))
    };
  }

  const run = await runAllPhases();
  const refreshed = await readStore();
  await replaceCollection("meta", {
    ...(refreshed.meta || {}),
    schedulerEnabled: true,
    schedulerIntervalMinutes: intervalMinutes,
    lastSchedulerRunAt: new Date().toISOString(),
    lastSchedulerRunOk: run.ok === true
  });

  await appendAuditLog({
    action: "scheduler.tick.run",
    entityType: "scheduler",
    details: {
      intervalMinutes,
      runOk: run.ok,
      summary: run.summary || {}
    }
  });

  return {
    ok: true,
    ran: true,
    due: true,
    intervalMinutes,
    summary: run.summary || {}
  };
}

