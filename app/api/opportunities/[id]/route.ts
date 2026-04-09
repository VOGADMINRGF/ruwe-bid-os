import { NextResponse } from "next/server";
import { readStore, replaceCollection } from "@/lib/storage";

export async function GET(_: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const db = await readStore();
  const row = (db.opportunities || []).find((x: any) => x.id === id) || null;
  return NextResponse.json(row);
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const body = await req.json();
  const db = await readStore();
  const rows = Array.isArray(db.opportunities) ? db.opportunities : [];

  const next = rows.map((x: any) =>
    x.id === id
      ? {
          ...x,
          ...body,
          updatedAt: new Date().toISOString()
        }
      : x
  );

  await replaceCollection("opportunities" as any, next);
  return NextResponse.json(next.find((x: any) => x.id === id) || null);
}
