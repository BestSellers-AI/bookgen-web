import { Injectable, Logger } from '@nestjs/common';
import { AppConfigService } from '../config/app-config.service';
import type {
  LlmCompletionOptions,
  LlmJsonCompletionOptions,
  LlmCompletionResult,
  LlmImageGenerationOptions,
  LlmImageWithReferenceOptions,
  LlmImageGenerationResult,
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

  async generateImage(options: LlmImageGenerationOptions): Promise<LlmImageGenerationResult> {
    const { model, prompt, temperature = 0.7 } = options;
    const maxRetries = this.config.llmMaxRetries;
    const timeoutMs = 180_000; // 3 min for image gen
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      const start = Date.now();

      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), timeoutMs);

        const body = {
          model,
          messages: [{ role: 'user', content: prompt }],
          modalities: ['image', 'text'],
          temperature,
        };

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
            const delay = Math.pow(4, attempt - 1) * 1000;
            this.logger.warn(
              `OpenRouter image ${statusCode} for ${model} (attempt ${attempt}/${maxRetries}), retrying in ${delay}ms`,
            );
            await this.sleep(delay);
            lastError = new Error(`OpenRouter HTTP ${statusCode}: ${responseText.slice(0, 200)}`);
            continue;
          }

          throw new Error(`OpenRouter HTTP ${statusCode}: ${responseText.slice(0, 500)}`);
        }

        const data = (await response.json()) as OpenRouterChatResponse;
        const latencyMs = Date.now() - start;

        const images = data.choices?.[0]?.message?.images;
        if (!images?.length) {
          throw new Error('No image returned by the model');
        }

        const imageUrl = images[0].image_url.url;

        // Extract base64 from data URL: "data:image/png;base64,..."
        let imageBase64: string;
        let mimeType = 'image/png';

        if (imageUrl.startsWith('data:')) {
          const match = imageUrl.match(/^data:([^;]+);base64,(.+)$/);
          if (!match) throw new Error('Invalid base64 data URL format');
          mimeType = match[1];
          imageBase64 = match[2];
        } else {
          // Direct URL — fetch and convert to base64
          const imgResponse = await fetch(imageUrl);
          const imgBuffer = Buffer.from(await imgResponse.arrayBuffer());
          imageBase64 = imgBuffer.toString('base64');
          mimeType = imgResponse.headers.get('content-type') || 'image/png';
        }

        this.logger.log(
          `Image gen: model=${data.model}, tokens=${data.usage?.total_tokens ?? 'N/A'}, latency=${latencyMs}ms`,
        );

        return {
          imageBase64,
          mimeType,
          textContent: data.choices?.[0]?.message?.content ?? '',
          model: data.model,
          usage: {
            promptTokens: data.usage?.prompt_tokens ?? 0,
            completionTokens: data.usage?.completion_tokens ?? 0,
            totalTokens: data.usage?.total_tokens ?? 0,
          },
          latencyMs,
        };
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        if (lastError.name === 'AbortError') {
          lastError = new Error(`Image generation timeout after ${timeoutMs}ms for ${model}`);
        }

        if (attempt < maxRetries) {
          const delay = Math.pow(4, attempt - 1) * 1000;
          this.logger.warn(
            `Image gen failed for ${model} (attempt ${attempt}/${maxRetries}): ${lastError.message}, retrying in ${delay}ms`,
          );
          await this.sleep(delay);
          continue;
        }

        this.logger.error(
          `Image gen failed for ${model} after ${maxRetries} attempts: ${lastError.message}`,
        );
      }
    }

    throw lastError ?? new Error('Image generation failed');
  }

  async generateImageWithReference(options: LlmImageWithReferenceOptions): Promise<LlmImageGenerationResult> {
    const { model, prompt, referenceImageUrl, temperature = 0.7 } = options;
    const maxRetries = this.config.llmMaxRetries;
    const timeoutMs = 180_000;
    let lastError: Error | null = null;

    // Fetch reference image and convert to base64
    let imageBase64Data: string;
    let imageMimeType: string;
    try {
      const imgResponse = await fetch(referenceImageUrl);
      if (!imgResponse.ok) {
        throw new Error(`Failed to fetch reference image: HTTP ${imgResponse.status}`);
      }
      const imgBuffer = Buffer.from(await imgResponse.arrayBuffer());
      imageMimeType = imgResponse.headers.get('content-type') || 'image/png';
      imageBase64Data = `data:${imageMimeType};base64,${imgBuffer.toString('base64')}`;
    } catch (error) {
      throw new Error(`Failed to fetch reference image: ${error instanceof Error ? error.message : String(error)}`);
    }

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      const start = Date.now();

      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), timeoutMs);

        const body = {
          model,
          messages: [{
            role: 'user',
            content: [
              { type: 'image_url', image_url: { url: imageBase64Data } },
              { type: 'text', text: prompt },
            ],
          }],
          modalities: ['image', 'text'],
          temperature,
        };

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
            const delay = Math.pow(4, attempt - 1) * 1000;
            this.logger.warn(
              `OpenRouter image-ref ${statusCode} for ${model} (attempt ${attempt}/${maxRetries}), retrying in ${delay}ms`,
            );
            await this.sleep(delay);
            lastError = new Error(`OpenRouter HTTP ${statusCode}: ${responseText.slice(0, 200)}`);
            continue;
          }

          throw new Error(`OpenRouter HTTP ${statusCode}: ${responseText.slice(0, 500)}`);
        }

        const data = (await response.json()) as OpenRouterChatResponse;
        const latencyMs = Date.now() - start;

        const images = data.choices?.[0]?.message?.images;
        if (!images?.length) {
          throw new Error('No image returned by the model');
        }

        const imageUrl = images[0].image_url.url;

        let resultBase64: string;
        let resultMime = 'image/png';

        if (imageUrl.startsWith('data:')) {
          const match = imageUrl.match(/^data:([^;]+);base64,(.+)$/);
          if (!match) throw new Error('Invalid base64 data URL format');
          resultMime = match[1];
          resultBase64 = match[2];
        } else {
          const imgResp = await fetch(imageUrl);
          const imgBuf = Buffer.from(await imgResp.arrayBuffer());
          resultBase64 = imgBuf.toString('base64');
          resultMime = imgResp.headers.get('content-type') || 'image/png';
        }

        this.logger.log(
          `Image-ref gen: model=${data.model}, tokens=${data.usage?.total_tokens ?? 'N/A'}, latency=${latencyMs}ms`,
        );

        return {
          imageBase64: resultBase64,
          mimeType: resultMime,
          textContent: data.choices?.[0]?.message?.content ?? '',
          model: data.model,
          usage: {
            promptTokens: data.usage?.prompt_tokens ?? 0,
            completionTokens: data.usage?.completion_tokens ?? 0,
            totalTokens: data.usage?.total_tokens ?? 0,
          },
          latencyMs,
        };
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        if (lastError.name === 'AbortError') {
          lastError = new Error(`Image-ref generation timeout after ${timeoutMs}ms for ${model}`);
        }

        if (attempt < maxRetries) {
          const delay = Math.pow(4, attempt - 1) * 1000;
          this.logger.warn(
            `Image-ref gen failed for ${model} (attempt ${attempt}/${maxRetries}): ${lastError.message}, retrying in ${delay}ms`,
          );
          await this.sleep(delay);
          continue;
        }

        this.logger.error(
          `Image-ref gen failed for ${model} after ${maxRetries} attempts: ${lastError.message}`,
        );
      }
    }

    throw lastError ?? new Error('Image-ref generation failed');
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
