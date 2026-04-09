import { NextResponse } from "next/server";
import { runAllPhases } from "@/lib/runAllPhased";

export async function POST(req: Request) {
  const origin = new URL(req.url).origin;
  const result = await runAllPhases(origin);
  return NextResponse.json(result);
}
