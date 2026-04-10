import { NextResponse } from "next/server";
import { closeMissingVariableWithParameter } from "@/lib/missingVariablesWorkflow";
import { rebuildOpportunities } from "@/lib/opportunityRebuild";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const body = await req.json();

  const result = await closeMissingVariableWithParameter(id, body.value, body.status || "defined");
  await rebuildOpportunities();

  return NextResponse.json({
    ok: true,
    result
  });
}
