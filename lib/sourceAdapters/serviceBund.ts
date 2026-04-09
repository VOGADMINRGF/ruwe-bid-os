import { SourceAdapter } from "./base";
import { ingestQueryResult } from "@/lib/queryIngest";

export const serviceBundAdapter: SourceAdapter = {
  sourceId: "src_service_bund",
  canSearch: true,
  async runQuery(query: string) {
    const res = await ingestQueryResult({
      sourceId: "src_service_bund",
      query
    });
    return {
      sourceId: "src_service_bund",
      query,
      inserted: !!res.inserted,
      duplicate: !!res.duplicate,
      discoveryMode: "search_query",
      row: res.row
    };
  }
};
