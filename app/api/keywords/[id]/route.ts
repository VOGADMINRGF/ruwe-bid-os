import { NextResponse } from "next/server";
import { readItemById, updateById } from "@/lib/storage";

export async function GET(_: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const item = await readItemById("siteTradeRules", id);
  return NextResponse.json(item ?? null, { status: item ? 200 : 404 });
}

export async function PUT(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const body = await req.json();
  const updated = await updateById("siteTradeRules", id, {
    keywordsPositive: body.keywordsPositive || [],
    keywordsNegative: body.keywordsNegative || [],
    regionNotes: body.regionNotes || ""
  });
  if (!updated) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json(updated);
}
