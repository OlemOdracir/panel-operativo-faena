import { Body, Controller, Get, HttpCode, Post, Res, UsePipes } from '@nestjs/common';
import type { Response } from 'express';
import { loginSchema } from '@faena/contracts';
import { ConfigService } from '@nestjs/config';
import type { Environment } from '../../config/environment';
import { AuthService } from './auth.service';
import { CurrentUser, Public } from './auth.decorators';
import { createCsrfToken, setSessionCookie } from './auth.guards';
import type { AuthenticatedUser } from './auth.types';
import { ZodValidationPipe } from '../../common/zod-validation.pipe';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly config: ConfigService<Environment, true>,
  ) {}

  @Public()
  @Get('csrf')
  csrf(@Res({ passthrough: true }) response: Response): { token: string } {
    const token = createCsrfToken();
    response.cookie('faena_csrf', token, {
      httpOnly: false,
      sameSite: 'strict',
      secure: this.config.get('AUTH_COOKIE_SECURE', { infer: true }),
      maxAge: 30 * 60 * 1000,
      path: '/',
    });
    return { token };
  }

  @Public()
  @Post('login')
  @UsePipes(new ZodValidationPipe(loginSchema))
  async login(
    @Body() body: { email: string; password: string },
    @Res({ passthrough: true }) response: Response,
  ): Promise<{ user: AuthenticatedUser }> {
    const result = await this.auth.login(body.email, body.password);
    setSessionCookie(
      response,
      result.token,
      this.config.get('AUTH_COOKIE_SECURE', { infer: true }),
    );
    return { user: result.user };
  }

  @Get('me')
  me(@CurrentUser() user: AuthenticatedUser): { user: AuthenticatedUser } {
    return { user };
  }

  @Post('logout')
  @HttpCode(204)
  logout(@Res({ passthrough: true }) response: Response): void {
    response.clearCookie('faena_session', {
      httpOnly: true,
      sameSite: 'strict',
      secure: this.config.get('AUTH_COOKIE_SECURE', { infer: true }),
      path: '/',
    });
  }
}
