import { NextResponse } from "next/server";
import { createId, readStore, replaceCollection } from "@/lib/storage";
import { ensureSourceRegistryDefaults, listSourceRegistry, sourceSummary } from "@/lib/sourceControl";
import { ensureSourceCapabilities } from "@/lib/sourceCapabilities";

export async function GET() {
  await ensureSourceRegistryDefaults();
  await ensureSourceCapabilities();
  const db = await readStore();
  return NextResponse.json(sourceSummary(db.sourceRegistry || []));
}

export async function POST(req: Request) {
  await ensureSourceRegistryDefaults();
  await ensureSourceCapabilities();
  const body = await req.json().catch(() => ({}));
  const rows = await listSourceRegistry();

  const row = {
    id: body?.id || createId("src"),
    name: body?.name || "Neue Quelle",
    type: body?.type || "portal",
    active: body?.active !== false,
    official: body?.official !== false,
    authRequired: body?.authRequired === true,
    legalUse: body?.legalUse || "mittel",
    dataMode: body?.dataMode || "live",
    notes: body?.notes || "",
    supportsFeed: body?.supportsFeed !== false,
    supportsQuerySearch: body?.supportsQuerySearch === true,
    supportsManualImport: body?.supportsManualImport !== false,
    supportsDeepLink: body?.supportsDeepLink === true,
    status: "idle",
    lastRunAt: null,
    lastRunOk: null,
    lastRunCount: 0,
    lastError: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  await replaceCollection("sourceRegistry", [...rows, row]);
  return NextResponse.json(row);
}
