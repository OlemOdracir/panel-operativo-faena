import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import argon2 from 'argon2';
import { PrismaService } from '../../database/prisma.service';
import type { Environment } from '../../config/environment';
import type { AuthenticatedUser } from './auth.types';
import { esCL } from '@faena/contracts';

// Public, intentionally unusable hash that equalizes failed login verification time.
const DUMMY_PASSWORD_HASH =
  '$argon2id$v=19$m=65536,p=4,t=3$yE2apaJrWB15yso4TEZphg$DAifBACwQXlyDf11533jaY+k6pm5avEl/IUfiXHUKxM';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService<Environment, true>,
  ) {}

  async login(
    email: string,
    password: string,
  ): Promise<{ token: string; user: AuthenticatedUser }> {
    const user = await this.prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    const passwordHash = user?.active ? user.passwordHash : DUMMY_PASSWORD_HASH;
    const passwordMatches = await argon2.verify(passwordHash, password).catch(() => false);
    const valid = Boolean(user?.active) && passwordMatches;
    if (!valid || !user)
      throw new UnauthorizedException({
        code: 'INVALID_CREDENTIALS',
        message: esCL.api.invalidCredentials,
      });
    const sessionUser: AuthenticatedUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };
    const token = await this.jwt.signAsync(
      { sub: user.id, email: user.email, name: user.name, role: user.role },
      { expiresIn: '30m', secret: this.config.get('JWT_SECRET', { infer: true }) },
    );
    return { token, user: sessionUser };
  }
}
