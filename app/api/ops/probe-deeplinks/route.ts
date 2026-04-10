import { NextResponse } from "next/server";
import { probeDeepLinks } from "@/lib/deepLinkProbe";

export async function GET() {
  const result = await probeDeepLinks();
  return NextResponse.json({ ok: true, ...result });
}

export async function POST() {
  const result = await probeDeepLinks();
  return NextResponse.json({ ok: true, ...result });
}
