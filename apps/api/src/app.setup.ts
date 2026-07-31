import type { INestApplication } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { HttpExceptionFilter } from './common/http-exception.filter';
import { requestIdMiddleware } from './common/request-id.middleware';
import type { Environment } from './config/environment';

export const API_PREFIX = 'api/v1';

export function configureApplication(
  app: INestApplication,
  config: ConfigService<Environment, true>,
): void {
  app.use(cookieParser());
  app.use(requestIdMiddleware);
  app.useGlobalFilters(new HttpExceptionFilter());
  app.use(helmet());
  app.enableCors({
    credentials: true,
    origin: config
      .get('CORS_ORIGIN', { infer: true })
      .split(',')
      .map((origin) => origin.trim()),
  });
  app.setGlobalPrefix(API_PREFIX);

  if (config.get('SWAGGER_ENABLED', { infer: true })) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Panel Operativo de Faena API')
      .setDescription('API para monitoreo de sensores y gestión del trabajo en terreno.')
      .setVersion('0.1.0')
      .addCookieAuth('faena_session')
      .build();

    SwaggerModule.setup('docs', app, SwaggerModule.createDocument(app, swaggerConfig));
  }
}
