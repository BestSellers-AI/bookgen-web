import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe, Logger } from '@nestjs/common';
import helmet from 'helmet';
import { Logger as PinoLogger } from 'nestjs-pino';
import { AppModule } from './app.module';
import { AppConfigService } from './config/app-config.service';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
    rawBody: true,
  });

  // Use NestJS built-in body parser with custom limits (preserves rawBody for Stripe webhooks)
  // IMPORTANT: Do NOT use app.use(json()) — it overwrites NestJS's rawBody parser
  app.useBodyParser('json', { limit: '5mb' });
  app.useBodyParser('urlencoded', { extended: true, limit: '5mb' } as any);

  const configService = app.get(AppConfigService);
  app.useLogger(app.get(PinoLogger));

  app.use(helmet());
  app.enableCors({
    origin: configService.frontendUrl,
    credentials: true,
  });

  app.setGlobalPrefix('api', {
    exclude: [{ path: 'health', method: -1 as any }],
  });

  app.useGlobalFilters(new AllExceptionsFilter());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  const port = configService.apiPort;
  await app.listen(port);

  const logger = new Logger('Bootstrap');
  logger.log(`API running on http://localhost:${port}`);
}

bootstrap();
