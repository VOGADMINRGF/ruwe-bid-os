import { NextResponse } from "next/server";
import { readStore } from "@/lib/storage";
import { sourceHealth, sourceUsefulnessExplain } from "@/lib/sourceLogic";
import { ensureConnectors, listConnectors, testConnector } from "@/lib/connectors";
import { refreshAllSources } from "@/lib/sourceRefreshOrchestrator";

async function buildRows() {
  const db = await readStore();
  const registry = Array.isArray(db.sourceRegistry) ? db.sourceRegistry : [];
  const stats = Array.isArray(db.sourceStats) ? db.sourceStats : [];
  const hits = Array.isArray(db.sourceHits) ? db.sourceHits : [];
  const history = Array.isArray(db.queryHistory) ? db.queryHistory : [];

  const rows = registry.map((src: any) => {
    const stat = stats.find((s: any) => s.id === src.id || s.sourceId === src.id) || null;
    const explain = sourceUsefulnessExplain({
      stat,
      hits: hits.filter((x: any) => x.sourceId === src.id),
      queryRuns: history.filter((x: any) => x.sourceId === src.id).slice(0, 10)
    });
    return {
      ...src,
      stat,
      health: sourceHealth(stat, { hits: hits.filter((x: any) => x.sourceId === src.id) }),
      usefulnessScore: explain.score,
      usefulnessBucket: explain.bucket,
      usefulnessReasons: explain.reasons,
      metrics: explain.metrics
    };
  });

  return rows;
}

export async function GET() {
  return NextResponse.json(await buildRows());
}

export async function POST(req: Request) {
  await ensureConnectors();
  const contentType = req.headers.get("content-type") || "";
  let runRefresh = false;
  if (contentType.includes("application/json")) {
    const body = await req.json().catch(() => ({}));
    runRefresh = body?.runRefresh === true || body?.runRefresh === "true";
  } else {
    const form = await req.formData().catch(() => null);
    const raw = form?.get("runRefresh");
    runRefresh = raw === "true" || raw === "1" || raw === "yes" || raw === "on";
  }
  const connectors = await listConnectors();
  const connectorTests: any[] = [];

  for (const conn of connectors) {
    const tested = await testConnector(conn.id);
    connectorTests.push({
      id: conn.id,
      ok: tested?.lastTestOk === true,
      message: tested?.lastTestMessage || null,
      at: tested?.lastTestAt || null
    });
  }

  let refreshResult: any = null;
  if (runRefresh) {
    refreshResult = await refreshAllSources();
  }

  return NextResponse.json({
    ok: true,
    connectorTests,
    refreshSummary: refreshResult?.summary || null,
    rows: await buildRows()
  });
}
