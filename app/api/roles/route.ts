import { NextResponse } from "next/server";
import { ensureRolesModel, listRoles } from "@/lib/roles";

export async function GET() {
  await ensureRolesModel();
  return NextResponse.json(await listRoles());
}

