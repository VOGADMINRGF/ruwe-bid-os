import { NextResponse } from "next/server";
import { listQueryRuns } from "@/lib/queryHistory";

export async function GET() {
  return NextResponse.json(await listQueryRuns());
}
