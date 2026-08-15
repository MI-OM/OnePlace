export type AIMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type AICompletion = {
  content: string;
  model: string;
  provider: string;
};

export type AIProviderOptions = {
  maxTokens?: number;
  timeoutMs?: number;
};

/**
 * Provider-agnostic interface (Doc 14 §4). The application only ever
 * talks to this interface; concrete providers are replaceable infrastructure.
 */
export interface AIProvider {
  generateReply(
    messages: AIMessage[],
    options?: AIProviderOptions,
  ): Promise<AICompletion>;
}
