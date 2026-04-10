import { NextResponse } from "next/server";
import { refreshSource } from "@/lib/sourceRefreshOrchestrator";

export async function POST(_: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const result = await refreshSource(id);
  return NextResponse.json(result, { status: result.ok ? 200 : 500 });
}
