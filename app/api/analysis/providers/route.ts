import { NextResponse } from "next/server";
import { getProviderConfig } from "@/lib/analysisProviders";

export async function GET() {
  return NextResponse.json(getProviderConfig());
}
