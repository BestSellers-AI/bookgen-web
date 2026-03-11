import { Injectable, Logger } from '@nestjs/common';
import { AppConfigService } from '../config/app-config.service';
import type {
  LlmCompletionOptions,
  LlmJsonCompletionOptions,
  LlmCompletionResult,
  OpenRouterChatResponse,
} from './llm.types';

const RETRYABLE_STATUS_CODES = [429, 500, 502, 503];

@Injectable()
export class LlmService {
  private readonly logger = new Logger(LlmService.name);

  constructor(private readonly config: AppConfigService) {}

  async chatCompletion(options: LlmCompletionOptions): Promise<LlmCompletionResult> {
    const { model, systemPrompt, userPrompt, temperature = 0.7, maxTokens } = options;

    const body: Record<string, unknown> = {
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature,
    };

    if (maxTokens) {
      body.max_tokens = maxTokens;
    }

    return this.callOpenRouter(body, model);
  }

  async chatCompletionJson<T>(options: LlmJsonCompletionOptions): Promise<T> {
    const { model, systemPrompt, userPrompt, schema, schemaName, temperature = 0.7, maxTokens } = options;

    const body: Record<string, unknown> = {
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature,
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: schemaName ?? 'response',
          strict: true,
          schema,
        },
      },
    };

    if (maxTokens) {
      body.max_tokens = maxTokens;
    }

    const result = await this.callOpenRouter(body, model);

    try {
      return JSON.parse(result.content) as T;
    } catch (error) {
      this.logger.error(`Failed to parse JSON response from ${model}: ${result.content.slice(0, 200)}`);
      throw new Error(`LLM returned invalid JSON: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async callOpenRouter(
    body: Record<string, unknown>,
    model: string,
  ): Promise<LlmCompletionResult> {
    const maxRetries = this.config.llmMaxRetries;
    const timeoutMs = this.config.llmTimeoutMs;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      const start = Date.now();

      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), timeoutMs);

        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.config.openRouterApiKey}`,
          },
          body: JSON.stringify(body),
          signal: controller.signal,
        });

        clearTimeout(timeout);

        if (!response.ok) {
          const statusCode = response.status;
          const responseText = await response.text().catch(() => '');

          if (RETRYABLE_STATUS_CODES.includes(statusCode) && attempt < maxRetries) {
            const delay = Math.pow(4, attempt - 1) * 1000; // 1s, 4s, 16s
            this.logger.warn(
              `OpenRouter ${statusCode} for ${model} (attempt ${attempt}/${maxRetries}), retrying in ${delay}ms`,
            );
            await this.sleep(delay);
            lastError = new Error(`OpenRouter HTTP ${statusCode}: ${responseText.slice(0, 200)}`);
            continue;
          }

          throw new Error(`OpenRouter HTTP ${statusCode}: ${responseText.slice(0, 500)}`);
        }

        const data = (await response.json()) as OpenRouterChatResponse;
        const latencyMs = Date.now() - start;

        const content = data.choices?.[0]?.message?.content ?? '';

        this.logger.log(
          `LLM call: model=${data.model}, tokens=${data.usage?.total_tokens ?? 'N/A'}, latency=${latencyMs}ms`,
        );

        return {
          content,
          model: data.model,
          usage: {
            promptTokens: data.usage?.prompt_tokens ?? 0,
            completionTokens: data.usage?.completion_tokens ?? 0,
            totalTokens: data.usage?.total_tokens ?? 0,
          },
          latencyMs,
        };
      } catch (error) {
        const latencyMs = Date.now() - start;
        lastError = error instanceof Error ? error : new Error(String(error));

        if (lastError.name === 'AbortError') {
          lastError = new Error(`OpenRouter timeout after ${timeoutMs}ms for ${model}`);
        }

        if (attempt < maxRetries) {
          const delay = Math.pow(4, attempt - 1) * 1000;
          this.logger.warn(
            `LLM call failed for ${model} (attempt ${attempt}/${maxRetries}, ${latencyMs}ms): ${lastError.message}, retrying in ${delay}ms`,
          );
          await this.sleep(delay);
          continue;
        }

        this.logger.error(
          `LLM call failed for ${model} after ${maxRetries} attempts (${latencyMs}ms): ${lastError.message}`,
        );
      }
    }

    throw lastError ?? new Error('LLM call failed');
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
