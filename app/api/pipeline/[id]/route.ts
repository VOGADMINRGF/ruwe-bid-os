import { NextResponse } from "next/server";
import { readDb, writeDb } from "@/lib/db";

const key = "pipeline";

export async function GET(_: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const db = await readDb();
  const item = (db[key] || []).find((x: any) => x.id === id);
  return NextResponse.json(item ?? null, { status: item ? 200 : 404 });
}

export async function PUT(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const patch = await req.json();
  const db = await readDb();
  const list = db[key] || [];
  const idx = list.findIndex((x: any) => x.id === id);
  if (idx === -1) return NextResponse.json({ error: "not_found" }, { status: 404 });
  list[idx] = { ...list[idx], ...patch };
  db[key] = list;
  await writeDb(db);
  return NextResponse.json(list[idx]);
}

export async function DELETE(_: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const db = await readDb();
  db[key] = (db[key] || []).filter((x: any) => x.id !== id);
  await writeDb(db);
  return NextResponse.json({ ok: true });
}
