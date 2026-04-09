import { NextResponse } from "next/server";
import { listOpportunities } from "@/lib/opportunityLogic";

export async function GET() {
  return NextResponse.json(await listOpportunities());
}
