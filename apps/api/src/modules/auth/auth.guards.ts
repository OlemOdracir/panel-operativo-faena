import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { Request, Response } from 'express';
import type { Environment } from '../../config/environment';
import type { AuthenticatedUser } from './auth.types';
import { IS_PUBLIC_KEY } from './auth.decorators';
import { ROLES_KEY } from './roles.decorator';
import { esCL, type Role } from '@faena/contracts';
import { randomBytes, timingSafeEqual } from 'node:crypto';

type RequestWithUser = Request & { user?: AuthenticatedUser };

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwt: JwtService,
    private readonly config: ConfigService<Environment, true>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (
      this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
        context.getHandler(),
        context.getClass(),
      ])
    )
      return true;
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const token = request.cookies?.faena_session as string | undefined;
    if (!token)
      throw new UnauthorizedException({
        code: 'UNAUTHORIZED',
        message: esCL.api.authenticationRequired,
      });
    try {
      const payload = await this.jwt.verifyAsync<{
        sub: string;
        email: string;
        name: string;
        role: Role;
      }>(token, { secret: this.config.get('JWT_SECRET', { infer: true }) });
      request.user = {
        id: payload.sub,
        email: payload.email,
        name: payload.name,
        role: payload.role,
      };
      return true;
    } catch {
      throw new UnauthorizedException({
        code: 'UNAUTHORIZED',
        message: esCL.api.authenticationRequired,
      });
    }
  }
}

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!roles?.length) return true;
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    if (!request.user || !roles.includes(request.user.role))
      throw new ForbiddenException({
        code: 'FORBIDDEN',
        message: esCL.api.insufficientPermissions,
      });
    return true;
  }
}

@Injectable()
export class CsrfGuard implements CanActivate {
  constructor(private readonly config: ConfigService<Environment, true>) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) return true;
    const cookie = request.cookies?.faena_csrf as string | undefined;
    const header = request.header('X-CSRF-Token');
    const origin = request.header('Origin');
    const allowedOrigins = this.config
      .get('CORS_ORIGIN', { infer: true })
      .split(',')
      .map((value) => value.trim());
    if (origin && !allowedOrigins.includes(origin))
      throw new ForbiddenException({
        code: 'CSRF_ORIGIN_REJECTED',
        message: esCL.api.originNotAllowed,
      });
    if (
      !cookie ||
      !header ||
      cookie.length !== header.length ||
      !timingSafeEqual(Buffer.from(cookie), Buffer.from(header))
    ) {
      throw new ForbiddenException({ code: 'CSRF_INVALID', message: esCL.api.invalidCsrfToken });
    }
    return true;
  }
}

export function createCsrfToken(): string {
  return randomBytes(32).toString('hex');
}
export function setSessionCookie(response: Response, token: string, secure: boolean): void {
  response.cookie('faena_session', token, {
    httpOnly: true,
    sameSite: 'strict',
    secure,
    maxAge: 30 * 60 * 1000,
    path: '/',
  });
}
