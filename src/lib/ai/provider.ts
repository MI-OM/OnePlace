import type { AIProvider } from "@/lib/ai/types";
import { FallbackProvider } from "@/lib/ai/fallback";
import { OpenAIProvider } from "@/lib/ai/openai";

let cached: AIProvider | null = null;

/**
 * Returns the active provider: OpenAI when a key is configured, otherwise a
 * graceful fallback. The fallback keeps chat fully testable without a key.
 */
export function getAIProvider(): AIProvider {
  if (cached) return cached;

  const apiKey = process.env.OPENAI_API_KEY;
  if (apiKey) {
    cached = new OpenAIProvider(apiKey, process.env.AI_MODEL ?? "gpt-4o-mini");
  } else {
    cached = new FallbackProvider();
  }

  return cached;
}

export function hasAIProvider(): boolean {
  return Boolean(process.env.OPENAI_API_KEY);
}
