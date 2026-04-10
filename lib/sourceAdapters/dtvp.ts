import { SourceAdapter } from "./base";

export const dtvpAdapter: SourceAdapter = {
  sourceId: "src_dtvp",
  canSearch: false,
  async runQuery(query: string) {
    return {
      sourceId: "src_dtvp",
      query,
      inserted: false,
      duplicate: false,
      status: "unsupported",
      reason: "DTVP benötigt Partner-/Portalzugang; ohne legalen Zugang derzeit nicht automatisiert suchfähig.",
      discoveryMode: "search_query",
      row: null
    };
  }
};
