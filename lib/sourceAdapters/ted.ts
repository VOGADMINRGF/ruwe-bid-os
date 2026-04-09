import { SourceAdapter } from "./base";
import { ingestQueryResult } from "@/lib/queryIngest";

export const tedAdapter: SourceAdapter = {
  sourceId: "src_ted",
  canSearch: true,
  async runQuery(query: string) {
    const res = await ingestQueryResult({
      sourceId: "src_ted",
      query
    });
    return {
      sourceId: "src_ted",
      query,
      inserted: !!res.inserted,
      duplicate: !!res.duplicate,
      discoveryMode: "search_query",
      row: res.row
    };
  }
};
