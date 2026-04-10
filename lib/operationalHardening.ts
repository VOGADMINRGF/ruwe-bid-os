import { listLiveQueryPresets } from "@/lib/liveQueryPresets";
import { getAdapter } from "@/lib/sourceAdapters";
import { appendQueryRun } from "@/lib/queryHistory";
import { probeDeepLinks } from "@/lib/deepLinkProbe";
import { rebuildOpportunities } from "@/lib/opportunityRebuild";
import { readStore } from "@/lib/storage";
import { toPlain } from "@/lib/serializers";

export async function runOperationalHardening() {
  const presets = await listLiveQueryPresets();
  const active = presets.filter((x: any) => x.active);

  const queryResults: any[] = [];

  for (const preset of active) {
    const adapter = getAdapter(preset.sourceId);
    if (!adapter || !adapter.canSearch) {
      queryResults.push({
        presetId: preset.id,
        label: preset.label,
        ok: false,
        reason: "Kein suchfähiger Adapter"
      });
      continue;
    }

    const result = await adapter.runQuery(preset.query);
    queryResults.push({
      presetId: preset.id,
      label: preset.label,
      ok: true,
      inserted: result.inserted,
      duplicate: result.duplicate,
      sourceId: result.sourceId,
      query: result.query
    });
  }

  await appendQueryRun({
    mode: "operational_hardening",
    queryCount: active.length,
    inserted: queryResults.filter((x) => x.inserted).length,
    duplicates: queryResults.filter((x) => x.duplicate).length,
    results: queryResults
  });

  const probe = await probeDeepLinks();
  const rebuild = await rebuildOpportunities();

  const db = await readStore();
  const opportunities = Array.isArray(db.opportunities) ? db.opportunities : [];
  const costGaps = Array.isArray(db.costGaps) ? db.costGaps : [];

  return toPlain({
    ok: true,
    presets: active.length,
    queryResults,
    probe,
    rebuild,
    summary: {
      opportunities: opportunities.length,
      missingVariables: costGaps.length
    }
  });
}
