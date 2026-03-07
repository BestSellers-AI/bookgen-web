import { Injectable, Logger } from '@nestjs/common';
import { AppConfigService } from '../config/app-config.service';

@Injectable()
export class N8nClientService {
  private readonly logger = new Logger(N8nClientService.name);

  constructor(private readonly appConfig: AppConfigService) {}

  async dispatchPreview(bookId: string, request: object): Promise<void> {
    const url = `${this.appConfig.n8nWebhookBaseUrl}${this.appConfig.n8nWebhookPreview}`;
    const body = {
      bookId,
      ...request,
      callbackBaseUrl: this.appConfig.n8nCallbackBaseUrl,
    };

    this.logger.log(`Dispatching preview for book ${bookId} → ${url}`);
    await this.dispatch(url, body);
  }

  async dispatchCompletePreview(bookId: string, request: object): Promise<void> {
    const url = `${this.appConfig.n8nWebhookBaseUrl}${this.appConfig.n8nWebhookPreviewComplete}`;
    const body = {
      bookId,
      ...request,
      callbackBaseUrl: this.appConfig.n8nCallbackBaseUrl,
    };

    this.logger.log(`Dispatching complete preview for book ${bookId} → ${url}`);
    await this.dispatch(url, body);
  }

  async dispatchGeneration(bookId: string, request: object): Promise<void> {
    const url = `${this.appConfig.n8nWebhookBaseUrl}${this.appConfig.n8nWebhookGeneration}`;
    const body = {
      bookId,
      ...request,
      callbackBaseUrl: this.appConfig.n8nCallbackBaseUrl,
    };

    this.logger.log(`Dispatching generation for book ${bookId} → ${url}`);
    await this.dispatch(url, body);
  }

  async dispatchAddon(
    bookId: string,
    addonId: string,
    addonKind: string,
    request: object,
  ): Promise<void> {
    const url = `${this.appConfig.n8nWebhookBaseUrl}${this.appConfig.n8nWebhookAddon}`;
    const body = {
      bookId,
      addonId,
      addonKind,
      ...request,
      callbackBaseUrl: this.appConfig.n8nCallbackBaseUrl,
    };

    this.logger.log(
      `Dispatching addon ${addonKind} for book ${bookId} → ${url}`,
    );
    await this.dispatch(url, body);
  }

  /**
   * Dispatch request to n8n. Throws on failure so callers can handle rollback.
   */
  private async dispatch(url: string, body: object): Promise<void> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-n8n-secret': this.appConfig.n8nCallbackSecret,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(
          `n8n returned HTTP ${response.status}: ${response.statusText}`,
        );
      }
    } catch (error) {
      this.logger.error(
        `n8n dispatch to ${url} failed: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }
}
