import { NextResponse } from "next/server";
import { buildQuellensteuerung } from "@/lib/quellensteuerung";

export async function GET() {
  const data = await buildQuellensteuerung();
  return NextResponse.json({ ok: true, ...data });
}
