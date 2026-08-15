import type { AICompletion, AIProvider } from "@/lib/ai/types";

/**
 * Keyless fallback used while no LLM provider is configured. Keeps the
 * conversation flow testable end-to-end without exposing internal config.
 */
export class FallbackProvider implements AIProvider {
  async generateReply(): Promise<AICompletion> {
    return {
      content:
        "We're unable to respond right now. You can leave a message and we'll get back to you.",
      model: "fallback",
      provider: "fallback",
    };
  }
}
