import { NextResponse } from "next/server";
import { updateSourceRegistryEntry } from "@/lib/sourceControl";
import { ensureSourceCapabilities } from "@/lib/sourceCapabilities";

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  const updated = await updateSourceRegistryEntry(id, body);
  await ensureSourceCapabilities();

  if (!updated) {
    return NextResponse.json({ ok: false, error: "source_not_found" }, { status: 404 });
  }
  return NextResponse.json(updated);
}

