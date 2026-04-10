import { promises as fs } from "fs";
import path from "path";

const DB_FILE = path.join(process.cwd(), "data", "db.json");

export function baseStore(overrides: Record<string, any> = {}) {
  return {
    meta: {},
    config: {},
    sourceRegistry: [],
    sourceStats: [],
    sourceHits: [],
    sites: [],
    serviceAreas: [],
    siteTradeRules: [],
    buyers: [],
    agents: [],
    agentKeywords: [],
    globalKeywords: { positive: [], negative: [] },
    costModels: [],
    costGaps: [],
    parameterMemory: [],
    opportunities: [],
    queryHistory: [],
    queryConfig: [],
    forecastSnapshots: [],
    connectors: [],
    learningRules: [],
    opportunityNotes: [],
    auditLogs: [],
    reviewTrail: [],
    tenders: [],
    pipeline: [],
    references: [],
    graphNodes: [],
    graphEdges: [],
    ...overrides
  };
}

export async function withIsolatedStore(
  store: Record<string, any>,
  fn: () => Promise<void> | void
) {
  let backup: string | null = null;
  try {
    backup = await fs.readFile(DB_FILE, "utf8");
  } catch {
    backup = null;
  }

  await fs.mkdir(path.dirname(DB_FILE), { recursive: true });
  await fs.writeFile(DB_FILE, JSON.stringify(store, null, 2) + "\n", "utf8");

  try {
    await fn();
  } finally {
    if (backup == null) {
      try {
        await fs.unlink(DB_FILE);
      } catch {}
    } else {
      await fs.writeFile(DB_FILE, backup, "utf8");
    }
  }
}

