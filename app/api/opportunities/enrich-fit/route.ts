import { NextResponse } from "next/server";
import { enrichOpportunitiesWithFit } from "@/lib/opportunityEnrichment";

export async function GET() {
  return NextResponse.json(await enrichOpportunitiesWithFit());
}
