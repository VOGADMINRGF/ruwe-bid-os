import { NextResponse } from "next/server";
import { readStore, replaceCollection } from "@/lib/storage";

export async function POST(_: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const db = await readStore();
  const rows = Array.isArray(db.sourceRegistry) ? db.sourceRegistry : [];

  const next = rows.map((x: any) =>
    x.id === id
      ? {
          ...x,
          status: "done",
          lastRunAt: new Date().toISOString(),
          lastRunOk: true,
          lastRunCount: Number(x.lastRunCount || 0),
          lastError: null,
          updatedAt: new Date().toISOString()
        }
      : x
  );

  await replaceCollection("sourceRegistry", next);

  return NextResponse.json({
    ok: true,
    sourceId: id,
    status: "done",
    progress: 100,
    note: "Einzelquelle aktualisiert."
  });
}
