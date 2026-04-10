import { NextResponse } from "next/server";
import { schedulerTick } from "@/lib/scheduler";

export async function GET() {
  return NextResponse.json(await schedulerTick());
}

export async function POST() {
  return GET();
}

