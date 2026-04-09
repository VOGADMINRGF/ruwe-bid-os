export type SourceAdapterResult = {
  sourceId: string;
  query: string;
  inserted: boolean;
  duplicate: boolean;
  discoveryMode: "search_query" | "manual_import" | "feed";
  row?: any;
};

export type SourceAdapter = {
  sourceId: string;
  canSearch: boolean;
  runQuery: (query: string) => Promise<SourceAdapterResult>;
};
