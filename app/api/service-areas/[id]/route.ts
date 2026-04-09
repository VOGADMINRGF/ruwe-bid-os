import { NextResponse } from "next/server";
import { deleteById, readItemById, updateById } from "@/lib/storage";

export async function GET(_: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const item = await readItemById("serviceAreas", id);
  return NextResponse.json(item ?? null, { status: item ? 200 : 404 });
}

export async function PUT(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const patch = await req.json();
  const updated = await updateById("serviceAreas", id, patch);
  if (!updated) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json(updated);
}

export async function DELETE(_: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  await deleteById("serviceAreas", id);
  return NextResponse.json({ ok: true });
}
