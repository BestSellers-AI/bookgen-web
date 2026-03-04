import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: Request, _res: Response, next: NextFunction) {
    const requestId =
      (req.headers['x-request-id'] as string) || randomUUID();
    req.headers['x-request-id'] = requestId;
    // Make it available to pino via req.id
    (req as any).id = requestId;
    next();
  }
}
