import { NextResponse } from "next/server";
import { rescanSourceHits } from "@/lib/sourceScanner";

export async function POST() {
  const result = await rescanSourceHits();
  return NextResponse.json({ ok: true, ...result });
}
