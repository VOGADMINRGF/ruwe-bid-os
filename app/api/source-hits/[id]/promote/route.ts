import { NextResponse } from "next/server";
import { upsertOpportunityFromHit } from "@/lib/opportunityLogic";
import { rebuildOpportunities } from "@/lib/opportunityRebuild";

export async function POST(_: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const opp = await upsertOpportunityFromHit(id);
  const rebuild = await rebuildOpportunities();
  return NextResponse.json({ ok: true, opportunity: opp, rebuild });
}
