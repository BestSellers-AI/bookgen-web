import { Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';
import { AppConfigService } from '../config/app-config.service';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly resend: Resend | null;
  private readonly from: string;

  constructor(private readonly appConfig: AppConfigService) {
    const apiKey = this.appConfig.resendApiKey;
    if (apiKey) {
      this.resend = new Resend(apiKey);
    } else {
      this.logger.warn(
        'RESEND_API_KEY not configured — emails will not be sent',
      );
      this.resend = null;
    }
    this.from = this.appConfig.emailFrom || 'BestSellers AI <noreply@bestsellers.ai>';
  }

  async send(params: {
    to: string;
    subject: string;
    html: string;
  }): Promise<void> {
    if (!this.resend) {
      this.logger.debug(`Email skipped (no API key): "${params.subject}" → ${params.to}`);
      return;
    }

    try {
      await this.resend.emails.send({
        from: this.from,
        to: params.to,
        subject: params.subject,
        html: params.html,
      });
      this.logger.log(`Email sent: "${params.subject}" → ${params.to}`);
    } catch (error) {
      this.logger.error(
        `Failed to send email "${params.subject}" to ${params.to}: ${error instanceof Error ? error.message : error}`,
      );
    }
  }
}
