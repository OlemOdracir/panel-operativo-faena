import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, it } from 'node:test';
import request from 'supertest';
import { App } from 'supertest/types';
import { configureApplication } from './../src/app.setup';
import type { Environment } from './../src/config/environment';

void describe('Health endpoint (e2e)', () => {
  let app: INestApplication<App>;

  void beforeEach(async () => {
    process.env.DATABASE_URL ??= 'postgresql://user:password@localhost:5432/faena';
    process.env.JWT_SECRET ??= 'a-development-only-secret-over-32-characters';
    process.env.SWAGGER_ENABLED ??= 'true';

    const { AppModule } = await import('./../src/app.module.js');
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    configureApplication(app, app.get(ConfigService<Environment, true>));
    await app.init();
  });

  void it('GET /api/v1/health', async () => {
    const response = await request(app.getHttpServer()).get('/api/v1/health').expect(200);
    const body: unknown = response.body;

    assert.match(JSON.stringify(body), /"service":"panel-operativo-faena-api"/);
    assert.match(JSON.stringify(body), /"status":"ok"/);
    assert.match(JSON.stringify(body), /"version":"0.1.0"/);
  });

  void it('GET /docs-json exposes the OpenAPI contract', async () => {
    const response = await request(app.getHttpServer()).get('/docs-json').expect(200);
    const contract: unknown = response.body;

    assert.match(JSON.stringify(contract), /"title":"Panel Operativo de Faena API"/);
    assert.match(JSON.stringify(contract), /"\/api\/v1\/health"/);
  });

  void afterEach(async () => {
    await app.close();
  });
});
