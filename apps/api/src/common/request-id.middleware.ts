import { randomUUID } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';

export type RequestWithId = Request & { requestId?: string };

export function requestIdMiddleware(req: RequestWithId, res: Response, next: NextFunction): void {
  const requestId = randomUUID();
  req.requestId = requestId;
  res.setHeader('X-Request-Id', requestId);
  res.on('finish', () => {
    console.info(
      JSON.stringify({ requestId, method: req.method, path: req.path, status: res.statusCode }),
    );
  });
  next();
}
