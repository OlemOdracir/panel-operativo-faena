import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { describe, it } from 'node:test';
import type { Response } from 'express';
import { requestIdMiddleware, type RequestWithId } from './request-id.middleware';

class ResponseStub extends EventEmitter {
  readonly headers = new Map<string, string>();
  statusCode = 200;

  setHeader(name: string, value: string): this {
    this.headers.set(name, value);
    return this;
  }
}

function requestWithId(value: string | undefined): RequestWithId {
  return {
    method: 'GET',
    path: '/api/v1/incidents',
    header: (name: string) => (name === 'X-Request-Id' ? value : undefined),
  } as unknown as RequestWithId;
}

void describe('request id middleware', () => {
  void it('propagates a valid incoming request id', () => {
    const incomingId = '123e4567-e89b-42d3-a456-426614174000';
    const request = requestWithId(incomingId);
    const response = new ResponseStub();

    requestIdMiddleware(request, response as unknown as Response, () => undefined);

    assert.equal(request.requestId, incomingId);
    assert.equal(response.headers.get('X-Request-Id'), incomingId);
  });

  void it('replaces malformed request ids with a generated UUID', () => {
    const request = requestWithId('untrusted value');
    const response = new ResponseStub();

    requestIdMiddleware(request, response as unknown as Response, () => undefined);

    assert.match(request.requestId ?? '', /^[0-9a-f-]{36}$/i);
    assert.notEqual(request.requestId, 'untrusted value');
  });
});
