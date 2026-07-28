import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { configureApplication } from './app.setup';
import type { Environment } from './config/environment';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService<Environment, true>);

  configureApplication(app, config);
  app.enableShutdownHooks();

  await app.listen(config.get('API_PORT', { infer: true }), '0.0.0.0');
}

bootstrap().catch((error: unknown) => {
  console.error('The API could not start.', error);
  process.exit(1);
});
