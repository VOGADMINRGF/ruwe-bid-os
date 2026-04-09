import { NextResponse } from "next/server";
import { readStore } from "@/lib/storage";
import { sourceHealth, sourceUsefulnessScore } from "@/lib/sourceLogic";

export async function GET() {
  const db = await readStore();
  const registry = db.sourceRegistry || [];
  const stats = db.sourceStats || [];

  const merged = registry.map((src: any) => {
    const stat = stats.find((s: any) => s.id === src.id) || null;
    return {
      ...src,
      stat,
      health: sourceHealth(stat),
      usefulnessScore: sourceUsefulnessScore(stat)
    };
  });

  return NextResponse.json(merged);
}
