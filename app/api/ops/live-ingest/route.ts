import { NextResponse } from "next/server";
import { runLiveIngest } from "@/lib/liveIngest";

export async function POST() {
  try {
    const result = await runLiveIngest();
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || "live_ingest_failed" },
      { status: 500 }
    );
  }
}
