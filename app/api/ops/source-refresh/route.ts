import { NextResponse } from "next/server";
import { refreshSource } from "@/lib/sourceRefreshOrchestrator";

async function run(req: Request) {
  const url = new URL(req.url);
  const sourceId = url.searchParams.get("sourceId");

  if (!sourceId) {
    return NextResponse.json({ ok: false, error: "sourceId fehlt" }, { status: 400 });
  }

  const result = await refreshSource(sourceId);
  return NextResponse.json(result, { status: result.ok ? 200 : 500 });
}

export async function GET(req: Request) {
  return run(req);
}

export async function POST(req: Request) {
  return run(req);
}
