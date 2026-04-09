import { NextResponse } from "next/server";
import { learnFromOpportunity } from "@/lib/parameterLearning";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const body = await req.json();
  const result = await learnFromOpportunity(id, body);
  return NextResponse.json(result);
}
