import { NextResponse } from "next/server";
import { runLiveIngest } from "@/lib/liveIngest";

export async function GET(req: Request) {
  try {
    const result = await runLiveIngest();
    const url = new URL(req.url);
    if (url.searchParams.get("redirect") === "1") {
      return NextResponse.redirect(new URL("/", req.url));
    }
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || "live_ingest_failed" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const result = await runLiveIngest();
    const url = new URL(req.url);
    if (url.searchParams.get("redirect") === "1") {
      return NextResponse.redirect(new URL("/", req.url));
    }
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || "live_ingest_failed" }, { status: 500 });
  }
}
