import { NextResponse } from "next/server";
import { closeMissingVariableWithParameter } from "@/lib/missingVariablesWorkflow";
import { rebuildOpportunities } from "@/lib/opportunityRebuild";
import { appendAuditLog } from "@/lib/auditLog";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const body = await req.json();

    const result = await closeMissingVariableWithParameter(id, body.value, body.status || "defined");
    const rebuild = await rebuildOpportunities();
    await appendAuditLog({
      actor: body?.by || "owner",
      action: "missing_variable.answer",
      entityType: "missing_variable",
      entityId: id,
      details: {
        value: body.value,
        status: body.status || "defined",
        opportunityId: result?.variable?.opportunityId || null
      }
    });

    return NextResponse.json({
      ok: true,
      result,
      rebuild
    });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || "answer_failed" },
      { status: 400 }
    );
  }
}
