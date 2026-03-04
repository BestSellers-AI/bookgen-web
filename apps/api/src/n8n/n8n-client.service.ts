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
      callbackBaseUrl: this.appConfig.apiUrl,
    };

    this.logger.log(`Dispatching preview for book ${bookId} → ${url}`);
    await this.fireAndForget(url, body);
  }

  async dispatchGeneration(bookId: string, request: object): Promise<void> {
    const url = `${this.appConfig.n8nWebhookBaseUrl}${this.appConfig.n8nWebhookGeneration}`;
    const body = {
      bookId,
      ...request,
      callbackBaseUrl: this.appConfig.apiUrl,
    };

    this.logger.log(`Dispatching generation for book ${bookId} → ${url}`);
    await this.fireAndForget(url, body);
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
      callbackBaseUrl: this.appConfig.apiUrl,
    };

    this.logger.log(
      `Dispatching addon ${addonKind} for book ${bookId} → ${url}`,
    );
    await this.fireAndForget(url, body);
  }

  private async fireAndForget(url: string, body: object): Promise<void> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);

    try {
      await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-n8n-secret': this.appConfig.n8nCallbackSecret,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
    } catch (error) {
      this.logger.warn(
        `Fire-and-forget request to ${url} failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    } finally {
      clearTimeout(timeout);
    }
  }
}
