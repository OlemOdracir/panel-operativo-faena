import { randomUUID } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';

export type RequestWithId = Request & { requestId?: string };
const requestIdPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function requestIdMiddleware(req: RequestWithId, res: Response, next: NextFunction): void {
  const incomingRequestId = req.header('X-Request-Id');
  const requestId =
    incomingRequestId && requestIdPattern.test(incomingRequestId)
      ? incomingRequestId
      : randomUUID();
  req.requestId = requestId;
  res.setHeader('X-Request-Id', requestId);
  res.on('finish', () => {
    if (req.path.endsWith('/health')) return;
    console.info(
      JSON.stringify({ requestId, method: req.method, path: req.path, status: res.statusCode }),
    );
  });
  next();
}
