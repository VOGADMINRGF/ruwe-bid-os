import { NextResponse } from "next/server";
import { overrideOpportunity } from "@/lib/opportunityOverrides";
import { enrichOpportunitiesWithFit } from "@/lib/opportunityEnrichment";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const body = await req.json();

  const result = await overrideOpportunity(id, body);
  await enrichOpportunitiesWithFit();

  return NextResponse.json({ ok: true, result });
}
