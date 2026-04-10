import { NextResponse } from "next/server";
import { getOpportunityDetail } from "@/lib/opportunityDetail";
import { buildProposalWorkbench } from "@/lib/proposalWorkbench";

export async function GET(_: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const detail = await getOpportunityDetail(id);
  if (!detail) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });

  return NextResponse.json({
    ok: true,
    detail,
    workbench: buildProposalWorkbench(detail)
  });
}
