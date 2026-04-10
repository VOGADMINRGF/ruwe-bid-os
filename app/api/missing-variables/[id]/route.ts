import { NextResponse } from "next/server";
import { closeMissingVariableWithParameter, updateMissingVariable } from "@/lib/missingVariablesWorkflow";

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const body = await req.json();
  return NextResponse.json(await updateMissingVariable(id, body));
}

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const body = await req.json();
  return NextResponse.json(await closeMissingVariableWithParameter(id, body.value, body.status || "defined"));
}
