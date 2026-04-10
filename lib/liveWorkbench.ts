import { readStore, replaceCollection } from "@/lib/storage";

export async function markLiveRun(status: "idle" | "running" | "done" | "error", step?: string, note?: string) {
  const db = await readStore();
  const meta = {
    ...(db.meta || {}),
    liveRunStatus: status,
    liveRunStep: step || null,
    liveRunNote: note || null,
    liveRunAt: new Date().toISOString()
  };
  await replaceCollection("meta", meta);
  return meta;
}

export async function readLiveRunState() {
  const db = await readStore();
  const meta = db.meta || {};
  return {
    status: meta.liveRunStatus || "idle",
    step: meta.liveRunStep || null,
    note: meta.liveRunNote || null,
    at: meta.liveRunAt || null
  };
}
