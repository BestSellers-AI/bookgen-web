export interface LlmCompletionOptions {
  model: string;
  systemPrompt: string;
  userPrompt: string;
  temperature?: number;
  maxTokens?: number;
}

export interface LlmJsonCompletionOptions extends LlmCompletionOptions {
  schema: object;
  schemaName?: string;
}

export interface LlmImageGenerationOptions {
  model: string;
  prompt: string;
  temperature?: number;
}

export interface LlmImageWithReferenceOptions {
  model: string;
  prompt: string;
  referenceImageUrl: string;
  temperature?: number;
}

export interface LlmImageGenerationResult {
  imageBase64: string;
  mimeType: string;
  textContent?: string;
  model: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  latencyMs: number;
}

export interface LlmCompletionResult {
  content: string;
  model: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  latencyMs: number;
}

export interface OpenRouterImageData {
  type: string;
  image_url: {
    url: string;
  };
}

export interface OpenRouterChatResponse {
  id: string;
  model: string;
  choices: Array<{
    message: {
      role: string;
      content: string;
      images?: OpenRouterImageData[];
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}
