import { NextResponse } from "next/server";
import { addOpportunityNote } from "@/lib/opportunityDetail";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const body = await req.json();
  return NextResponse.json(await addOpportunityNote(id, body));
}
