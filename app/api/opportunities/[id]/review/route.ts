import { NextResponse } from "next/server";
import { readStore, replaceCollection } from "@/lib/storage";
import { appendReviewTrail } from "@/lib/reviewTrail";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const body = await req.json();

  const db = await readStore();
  const rows = Array.isArray(db.opportunities) ? db.opportunities : [];

  const next = rows.map((x: any) =>
    x.id === id
      ? {
          ...x,
          manualDecision: body.manualDecision ?? x.manualDecision,
          manualReason: body.manualReason ?? x.manualReason,
          reviewedBy: body.reviewedBy || "system",
          reviewedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      : x
  );

  await replaceCollection("opportunities" as any, next);

  await appendReviewTrail({
    opportunityId: id,
    type: "manual_review",
    reviewedBy: body.reviewedBy || "system",
    manualDecision: body.manualDecision || null,
    manualReason: body.manualReason || ""
  });

  return NextResponse.json(next.find((x: any) => x.id === id) || null);
}
