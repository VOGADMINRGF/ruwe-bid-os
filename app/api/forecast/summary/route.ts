import { NextResponse } from "next/server";
import { buildForecastSummary } from "@/lib/forecastSummary";

export async function GET() {
  return NextResponse.json(await buildForecastSummary());
}
