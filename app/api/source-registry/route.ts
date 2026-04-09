import { NextResponse } from "next/server";
import { readStore } from "@/lib/storage";
import { ensureSourceRegistryDefaults, sourceSummary } from "@/lib/sourceControl";

export async function GET() {
  await ensureSourceRegistryDefaults();
  const db = await readStore();
  return NextResponse.json(sourceSummary(db.sourceRegistry || []));
}
