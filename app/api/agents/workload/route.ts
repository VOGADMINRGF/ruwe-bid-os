import { NextResponse } from "next/server";
import { computeAgentWorkload } from "@/lib/agentWorkload";

export async function GET() {
  return NextResponse.json(await computeAgentWorkload());
}
