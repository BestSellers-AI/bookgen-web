import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { timingSafeEqual } from 'crypto';
import { AppConfigService } from '../../config/app-config.service';

@Injectable()
export class N8nSecretGuard implements CanActivate {
  constructor(private readonly appConfig: AppConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const secret = request.headers['x-n8n-secret'] as string | undefined;

    if (!secret) {
      throw new UnauthorizedException('Missing x-n8n-secret header');
    }

    const expected = this.appConfig.n8nCallbackSecret;

    if (!expected) {
      throw new UnauthorizedException('n8n callback secret not configured');
    }

    const secretBuffer = Buffer.from(secret);
    const expectedBuffer = Buffer.from(expected);

    if (
      secretBuffer.length !== expectedBuffer.length ||
      !timingSafeEqual(secretBuffer, expectedBuffer)
    ) {
      throw new UnauthorizedException('Invalid x-n8n-secret');
    }

    return true;
  }
}
