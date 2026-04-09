import { SourceAdapter } from "./base";
import { ingestQueryResult } from "@/lib/queryIngest";

export const dtvpAdapter: SourceAdapter = {
  sourceId: "src_dtvp",
  canSearch: true,
  async runQuery(query: string) {
    const res = await ingestQueryResult({
      sourceId: "src_dtvp",
      query
    });
    return {
      sourceId: "src_dtvp",
      query,
      inserted: !!res.inserted,
      duplicate: !!res.duplicate,
      discoveryMode: "search_query",
      row: res.row
    };
  }
};
