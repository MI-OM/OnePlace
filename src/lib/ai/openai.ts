import type { AICompletion, AIMessage, AIProvider, AIProviderOptions } from "@/lib/ai/types";

const OPENAI_ENDPOINT = "https://api.openai.com/v1/chat/completions";

type OpenAIResponse = {
  model: string;
  choices: {
    message: { content: string | null };
  }[];
};

/**
 * OpenAI-compatible chat completion provider. Uses a plain fetch so the
 * provider stays swappable without baking an SDK into the app.
 */
export class OpenAIProvider implements AIProvider {
  constructor(
    private readonly apiKey: string,
    private readonly model: string,
  ) {}

  async generateReply(
    messages: AIMessage[],
    options: AIProviderOptions = {},
  ): Promise<AICompletion> {
    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      options.timeoutMs ?? 60_000,
    );

    try {
      const response = await fetch(OPENAI_ENDPOINT, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: this.model,
          messages,
          temperature: 0.7,
          max_tokens: options.maxTokens ?? 400,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`OpenAI request failed (${response.status})`);
      }

      const data = (await response.json()) as OpenAIResponse;
      const content = data.choices[0]?.message.content?.trim() ?? "";

      return { content, model: data.model ?? this.model, provider: "openai" };
    } finally {
      clearTimeout(timeout);
    }
  }
}
