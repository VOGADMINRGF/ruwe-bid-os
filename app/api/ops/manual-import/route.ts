import { NextResponse } from "next/server";
import { manualImportUrl } from "@/lib/queryIngest";

export async function POST(req: Request) {
  const body = await req.json();
  const url = String(body.url || "");
  const sourceId = String(body.sourceId || "manual");

  if (!/^https?:\/\//i.test(url)) {
    return NextResponse.json({ ok: false, error: "Ungültige URL" }, { status: 400 });
  }

  const row = await manualImportUrl(url, sourceId);
  return NextResponse.json({ ok: true, row });
}
