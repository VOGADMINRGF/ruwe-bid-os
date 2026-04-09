import { NextResponse } from "next/server";
import { getParameterRow, updateParameterRow } from "@/lib/parameterLearning";

export async function GET(_: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  return NextResponse.json(await getParameterRow(id));
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const body = await req.json();
  return NextResponse.json(await updateParameterRow(id, body));
}
