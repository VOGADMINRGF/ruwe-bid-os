import { NextResponse } from "next/server";
import { updateConnector } from "@/lib/connectors";

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const body = await req.json();
  return NextResponse.json(await updateConnector(id, body));
}
