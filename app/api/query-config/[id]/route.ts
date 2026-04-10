import { NextResponse } from "next/server";
import { updateQueryConfig } from "@/lib/queryConfig";

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const body = await req.json();
  return NextResponse.json(await updateQueryConfig(id, body));
}
