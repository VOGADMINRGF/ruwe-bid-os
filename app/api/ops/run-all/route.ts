import { NextResponse } from "next/server";
import { runAllPhases } from "@/lib/runAllPhased";

export async function GET() {
  return NextResponse.json(await runAllPhases());
}

export async function POST() {
  return GET();
}
