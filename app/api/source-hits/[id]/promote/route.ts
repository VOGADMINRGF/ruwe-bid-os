import { NextResponse } from "next/server";
import { upsertOpportunityFromHit } from "@/lib/opportunityLogic";

export async function POST(_: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const opp = await upsertOpportunityFromHit(id);
  return NextResponse.json(opp);
}
