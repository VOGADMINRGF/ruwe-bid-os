import { NextResponse } from "next/server";
import { runAllPhases } from "@/lib/runAllPhased";

export async function POST() {
  const result = await runAllPhases();
  return NextResponse.json(result);
}
