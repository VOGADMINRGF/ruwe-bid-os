import { NextResponse } from "next/server";
import { markLiveRun } from "@/lib/liveWorkbench";
import { runAllPhases } from "@/lib/runAllPhased";

export async function GET() {
  try {
    await markLiveRun("running", "quellenabruf", "Run-All gestartet");
    const result = await runAllPhases();
    await markLiveRun("done", "fertig", "Run-All erfolgreich abgeschlossen");
    return NextResponse.json(result);
  } catch (error: any) {
    await markLiveRun("error", "abbruch", error?.message || "Run-All fehlgeschlagen");
    return NextResponse.json(
      { ok: false, error: error?.message || "Run-All fehlgeschlagen" },
      { status: 500 }
    );
  }
}

export async function POST() {
  return GET();
}
