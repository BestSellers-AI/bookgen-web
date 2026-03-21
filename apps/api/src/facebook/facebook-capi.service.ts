import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';
import { AppConfigService } from '../config/app-config.service';

export interface FacebookEventData {
  event_name: string;
  event_id: string;
  event_time?: number;
  event_source_url?: string;
  action_source?: 'website' | 'email' | 'app' | 'phone_call' | 'chat' | 'physical_store' | 'system_generated' | 'other';
  user_data: {
    em?: string; // email (will be hashed)
    ph?: string; // phone (will be hashed)
    fn?: string; // first name (will be hashed)
    ln?: string; // last name (will be hashed)
    client_ip_address?: string;
    client_user_agent?: string;
    fbc?: string; // click ID cookie (NOT hashed)
    fbp?: string; // browser ID cookie (NOT hashed)
    external_id?: string; // (will be hashed)
  };
  custom_data?: {
    value?: number;
    currency?: string;
    content_ids?: string[];
    content_name?: string;
    content_type?: string;
    content_category?: string;
    num_items?: number;
  };
}

@Injectable()
export class FacebookCapiService {
  private readonly logger = new Logger(FacebookCapiService.name);

  constructor(private readonly appConfig: AppConfigService) {}

  /**
   * Send an event to Facebook Conversions API.
   * Fire-and-forget — never throws, never blocks the caller.
   */
  async sendEvent(data: FacebookEventData): Promise<void> {
    const pixelId = this.appConfig.facebookPixelId;
    const accessToken = this.appConfig.facebookCapiAccessToken;

    if (!pixelId || !accessToken) {
      this.logger.debug('Facebook CAPI not configured, skipping event');
      return;
    }

    try {
      const event = {
        event_name: data.event_name,
        event_id: data.event_id,
        event_time: data.event_time ?? Math.floor(Date.now() / 1000),
        event_source_url: data.event_source_url,
        action_source: data.action_source ?? 'website',
        user_data: this.hashUserData(data.user_data),
        custom_data: data.custom_data,
      };

      const url = `https://graph.facebook.com/v21.0/${pixelId}/events`;
      const body: Record<string, unknown> = {
        data: [event],
        access_token: accessToken,
      };

      const testEventCode = this.appConfig.facebookTestEventCode;
      if (testEventCode) {
        body.test_event_code = testEventCode;
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        this.logger.error(
          `Facebook CAPI error (${response.status}): ${errorBody}`,
        );
        return;
      }

      this.logger.log(
        `Facebook CAPI: sent ${data.event_name} event (event_id: ${data.event_id})`,
      );
    } catch (error) {
      this.logger.error(
        `Facebook CAPI failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Hash PII fields with SHA-256 per Facebook requirements.
   * fbc and fbp are NOT hashed (they're cookie identifiers).
   */
  private hashUserData(
    userData: FacebookEventData['user_data'],
  ): Record<string, string | undefined> {
    return {
      em: userData.em ? this.sha256(userData.em.toLowerCase().trim()) : undefined,
      ph: userData.ph ? this.sha256(userData.ph.replace(/\D/g, '')) : undefined,
      fn: userData.fn ? this.sha256(userData.fn.toLowerCase().trim()) : undefined,
      ln: userData.ln ? this.sha256(userData.ln.toLowerCase().trim()) : undefined,
      client_ip_address: userData.client_ip_address,
      client_user_agent: userData.client_user_agent,
      fbc: userData.fbc,
      fbp: userData.fbp,
      external_id: userData.external_id
        ? this.sha256(userData.external_id)
        : undefined,
    };
  }

  private sha256(value: string): string {
    return crypto.createHash('sha256').update(value).digest('hex');
  }
}
