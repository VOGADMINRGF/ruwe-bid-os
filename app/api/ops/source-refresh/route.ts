import { NextResponse } from "next/server";
import { updateSourceRegistryStatus } from "@/lib/sourceControl";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const sourceId = url.searchParams.get("sourceId");

  if (!sourceId) {
    return NextResponse.json({ ok: false, error: "sourceId fehlt" }, { status: 400 });
  }

  await updateSourceRegistryStatus(sourceId, {
    status: "running",
    lastRunAt: new Date().toISOString(),
    lastError: null
  });

  return NextResponse.json({
    ok: true,
    sourceId,
    note: "Einzelquellen-Abruf vorbereitet. Quelle wurde zum manuellen Refresh markiert."
  });
}
