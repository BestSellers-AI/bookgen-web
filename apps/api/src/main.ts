import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { json, urlencoded } from 'express';
import helmet from 'helmet';
import { Logger as PinoLogger } from 'nestjs-pino';
import { AppModule } from './app.module';
import { AppConfigService } from './config/app-config.service';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
    rawBody: true,
  });

  app.use(json({ limit: '5mb' }));
  app.use(urlencoded({ extended: true, limit: '5mb' }));

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
