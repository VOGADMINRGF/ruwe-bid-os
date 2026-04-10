import { NextResponse } from "next/server";
import { listAuditLogs } from "@/lib/auditLog";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const limit = Number(url.searchParams.get("limit") || 200);
  return NextResponse.json(await listAuditLogs(limit));
}

