import { runtimeConfig } from "./env";

export type AnalysisProvider = "openai" | "anthropic";

export function getProviderConfig() {
  return {
    defaultProvider: runtimeConfig.defaultAnalysisProvider,
    secondaryProvider: runtimeConfig.secondaryAnalysisProvider,
    providers: {
      openai: {
        enabled: Boolean(process.env.OPENAI_API_KEY),
        model: runtimeConfig.openaiModel
      },
      anthropic: {
        enabled: Boolean(process.env.ANTHROPIC_API_KEY),
        model: runtimeConfig.anthropicModel
      }
    }
  };
}

export async function analyzeTenderWithProvider(input: {
  provider?: AnalysisProvider;
  title: string;
  trade?: string;
  region?: string;
  keywords?: string[];
  text?: string;
}) {
  const provider = input.provider || (runtimeConfig.defaultAnalysisProvider as AnalysisProvider);

  return {
    provider,
    model: provider === "openai" ? runtimeConfig.openaiModel : runtimeConfig.anthropicModel,
    status: "stub",
    message: "Provider layer vorbereitet. Echte API-Calls werden nach env/local + secrets aktiviert.",
    input
  };
}
