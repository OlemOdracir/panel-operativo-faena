import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { ExecutionContext } from '@nestjs/common';
import { ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { CsrfGuard, RolesGuard, createCsrfToken } from './auth.guards';
import { ROLES_KEY } from './roles.decorator';
import type { Role } from '@faena/contracts';
import type { Environment } from '../../config/environment';

type RequestStub = {
  method: string;
  cookies?: Record<string, string>;
  headers?: Record<string, string>;
  user?: { role: Role };
  header: (name: string) => string | undefined;
};

function contextFor(request: RequestStub): ExecutionContext {
  return {
    getHandler: () => function handler() {},
    getClass: () => class TestController {},
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
}

function configWithOrigins(origins = 'http://localhost:8080'): ConfigService<Environment, true> {
  return { get: () => origins } as unknown as ConfigService<Environment, true>;
}

void describe('security guards', () => {
  void it('accepts a matching CSRF cookie and header for an allowed origin', () => {
    const token = createCsrfToken();
    const request: RequestStub = {
      method: 'POST',
      cookies: { faena_csrf: token },
      headers: { origin: 'http://localhost:8080', 'x-csrf-token': token },
      header: (name) => ({ Origin: 'http://localhost:8080', 'X-CSRF-Token': token })[name],
    };

    assert.equal(new CsrfGuard(configWithOrigins()).canActivate(contextFor(request)), true);
    assert.equal(token.length, 64);
  });

  void it('rejects a missing or mismatched CSRF token', () => {
    const request: RequestStub = {
      method: 'PATCH',
      cookies: { faena_csrf: 'cookie-token' },
      headers: { 'x-csrf-token': 'different-token' },
      header: (name) => ({ 'X-CSRF-Token': 'different-token' })[name],
    };

    assert.throws(
      () => new CsrfGuard(configWithOrigins()).canActivate(contextFor(request)),
      ForbiddenException,
    );
  });

  void it('rejects a cross-origin mutation before authentication', () => {
    const request: RequestStub = {
      method: 'POST',
      cookies: { faena_csrf: 'same-token' },
      headers: { origin: 'https://attacker.example', 'x-csrf-token': 'same-token' },
      header: (name) =>
        ({ Origin: 'https://attacker.example', 'X-CSRF-Token': 'same-token' })[name],
    };

    assert.throws(
      () => new CsrfGuard(configWithOrigins()).canActivate(contextFor(request)),
      (error: unknown) => {
        if (!(error instanceof ForbiddenException)) return false;
        const response = error.getResponse();
        return (
          typeof response === 'object' &&
          response !== null &&
          'code' in response &&
          response.code === 'CSRF_ORIGIN_REJECTED'
        );
      },
    );
  });

  void it('allows public GET requests without a CSRF token', () => {
    const request: RequestStub = { method: 'GET', header: () => undefined };
    assert.equal(new CsrfGuard(configWithOrigins()).canActivate(contextFor(request)), true);
  });

  void it('rejects role-protected requests without the required role', () => {
    const reflector = {
      getAllAndOverride: (key: unknown) => (key === ROLES_KEY ? ['ADMIN'] : undefined),
    } as unknown as Reflector;
    const request: RequestStub = {
      method: 'GET',
      user: { role: 'SUPERVISOR' },
      header: () => undefined,
    };

    assert.throws(
      () => new RolesGuard(reflector).canActivate(contextFor(request)),
      (error: unknown) => error instanceof ForbiddenException,
    );
  });
});
