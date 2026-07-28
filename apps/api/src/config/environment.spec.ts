import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { validateEnvironment } from './environment';

const validEnvironment = {
  NODE_ENV: 'test',
  API_PORT: '3000',
  CORS_ORIGIN: 'http://localhost:5173',
  DATABASE_URL: 'postgresql://user:password@localhost:5432/faena',
  JWT_SECRET: 'a-development-only-secret-over-32-characters',
  LOG_LEVEL: 'error',
  SWAGGER_ENABLED: 'false',
};

void describe('validateEnvironment', () => {
  void it('parses and types a valid environment', () => {
    assert.deepEqual(validateEnvironment(validEnvironment), {
      API_PORT: 3000,
      CORS_ORIGIN: 'http://localhost:5173',
      DATABASE_URL: 'postgresql://user:password@localhost:5432/faena',
      JWT_SECRET: 'a-development-only-secret-over-32-characters',
      LOG_LEVEL: 'error',
      NODE_ENV: 'test',
      SWAGGER_ENABLED: false,
    });
  });

  void it('rejects an unsafe short JWT secret', () => {
    assert.throws(
      () =>
        validateEnvironment({
          ...validEnvironment,
          JWT_SECRET: 'short',
        }),
      {
        message: /JWT_SECRET/,
      },
    );
  });
});
