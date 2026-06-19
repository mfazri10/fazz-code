import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";

export type ModelProvider = "anthropic" | "openai" | "google" | "xiaomi";

export interface ModelConfig {
  id: string;
  name: string;
  provider: ModelProvider;
}

export const AVAILABLE_MODELS: ModelConfig[] = [
  {
    id: "mimo-v2.5-pro",
    name: "MiMo v2.5 Pro",
    provider: "xiaomi",
  },
  {
    id: "mimo-v2.5",
    name: "MiMo v2.5",
    provider: "xiaomi",
  },
  {
    id: "claude-sonnet-4-20250514",
    name: "Claude Sonnet 4",
    provider: "anthropic",
  },
  {
    id: "gpt-4o",
    name: "GPT-4o",
    provider: "openai",
  },
  {
    id: "gemini-2.0-flash",
    name: "Gemini 2.0 Flash",
    provider: "google",
  },
];

// Xiaomi uses OpenAI-compatible API
const xiaomi = createOpenAI({
  apiKey: process.env.XIAOMI_API_KEY || process.env.ANTHROPIC_API_KEY,
  baseURL: process.env.XIAOMI_BASE_URL || "https://token-plan-sgp.xiaomimimo.com/v1",
});

export function getModel(modelId: string) {
  const model = AVAILABLE_MODELS.find((m) => m.id === modelId);
  if (!model) {
    throw new Error(`Unknown model: ${modelId}`);
  }

  switch (model.provider) {
    case "xiaomi": {
      return xiaomi(model.id);
    }
    case "anthropic": {
      const anthropic = createAnthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
        baseURL: process.env.ANTHROPIC_BASE_URL,
      });
      return anthropic(model.id);
    }
    case "openai": {
      const openai = createOpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
      return openai(model.id);
    }
    case "google": {
      const google = createGoogleGenerativeAI({
        apiKey: process.env.GOOGLE_API_KEY,
      });
      return google(model.id);
    }
    default:
      throw new Error(`Unsupported provider: ${model.provider}`);
  }
}
