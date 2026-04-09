import { NextResponse } from "next/server";
import { readStore, replaceCollection } from "@/lib/storage";

export async function POST() {
  const db = await readStore();
  const now = new Date().toISOString();

  const updatedStats = (db.sourceStats || []).map((row: any) => ({
    ...row,
    lastFetchAt: now,
    lastRunOk: true
  }));

  const updatedMeta = {
    ...(db.meta || {}),
    lastSuccessfulIngestionAt: now,
    lastSuccessfulIngestionSource: "Manueller Testlauf"
  };

  await replaceCollection("sourceStats", updatedStats);
  await replaceCollection("meta", [updatedMeta]);

  return NextResponse.json({
    ok: true,
    refreshedAt: now
  });
}
