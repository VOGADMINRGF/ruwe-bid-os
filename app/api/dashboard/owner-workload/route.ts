import { NextResponse } from "next/server";
import { buildOwnerWorkload } from "@/lib/ownerWorkload";

export async function GET() {
  return NextResponse.json(await buildOwnerWorkload());
}
