import { NextResponse } from "next/server";
import { testConnector } from "@/lib/connectors";

export async function POST(_: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  return NextResponse.json(await testConnector(id));
}
