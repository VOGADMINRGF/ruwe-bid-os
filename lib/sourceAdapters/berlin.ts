import { SourceAdapter } from "./base";
import { ingestQueryResult } from "@/lib/queryIngest";

export const berlinAdapter: SourceAdapter = {
  sourceId: "src_berlin",
  canSearch: true,
  async runQuery(query: string) {
    const res = await ingestQueryResult({
      sourceId: "src_berlin",
      query
    });
    return {
      sourceId: "src_berlin",
      query,
      inserted: !!res.inserted,
      duplicate: !!res.duplicate,
      status: (res as any).status || null,
      reason: (res as any).reason || null,
      discoveryMode: "search_query",
      row: res.row
    };
  }
};
