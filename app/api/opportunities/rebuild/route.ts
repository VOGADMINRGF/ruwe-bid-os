import { NextResponse } from "next/server";
import { rebuildOpportunities } from "@/lib/opportunityRebuild";

export async function GET() {
  return NextResponse.json(await rebuildOpportunities());
}
