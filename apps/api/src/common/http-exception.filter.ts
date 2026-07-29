import {
  Catch,
  type ArgumentsHost,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { Response } from 'express';
import { esCL } from '@faena/contracts';
import type { RequestWithId } from './request-id.middleware';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();
    const request = context.getRequest<RequestWithId>();
    const status =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const payload = exception instanceof HttpException ? exception.getResponse() : undefined;
    const body =
      typeof payload === 'object' && payload !== null ? (payload as Record<string, unknown>) : {};
    const code = typeof body.code === 'string' ? body.code : this.codeForStatus(status);
    const message =
      typeof body.message === 'string' ? body.message : esCL.api.unexpectedServerError;
    const details = body.details;
    response.status(status).json({
      code,
      message,
      requestId: request.requestId ?? 'unknown',
      ...(details === undefined ? {} : { details }),
    });
  }

  private codeForStatus(status: number): string {
    const known: Record<number, string> = {
      400: 'BAD_REQUEST',
      401: 'UNAUTHORIZED',
      403: 'FORBIDDEN',
      404: 'NOT_FOUND',
      409: 'CONFLICT',
    };
    return known[status] ?? 'INTERNAL_SERVER_ERROR';
  }
}
