import { NextResponse } from "next/server";
import { runOperationalHardening } from "@/lib/operationalHardening";

export async function GET() {
  return NextResponse.json(await runOperationalHardening());
}
