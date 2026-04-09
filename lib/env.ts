export function env(name: string, fallback = "") {
  return process.env[name] ?? fallback;
}

export const runtimeConfig = {
  appEnv: env("APP_ENV", "local"),
  mongoUri: env("MONGODB_URI", ""),
  mongoDbName: env("MONGODB_DB_NAME", "ruwe_bid_os"),
  ingestionEnabled: env("INGESTION_ENABLED", "false") === "true",
  ingestionIntervalMinutes: Number(env("INGESTION_INTERVAL_MINUTES", "60")),
  defaultAnalysisProvider: env("DEFAULT_ANALYSIS_PROVIDER", "openai"),
  secondaryAnalysisProvider: env("SECONDARY_ANALYSIS_PROVIDER", "anthropic"),
  openaiModel: env("OPENAI_MODEL", "gpt-5"),
  anthropicModel: env("ANTHROPIC_MODEL", "claude-sonnet-4-5")
};

export function hasMongo() {
  return Boolean(runtimeConfig.mongoUri && runtimeConfig.mongoDbName);
}
