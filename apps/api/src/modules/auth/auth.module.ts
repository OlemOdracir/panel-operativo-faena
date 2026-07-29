import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import type { Environment } from '../../config/environment';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { CsrfGuard, JwtAuthGuard, RolesGuard } from './auth.guards';

@Module({
  imports: [
    ConfigModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<Environment, true>) => ({
        secret: config.get('JWT_SECRET', { infer: true }),
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_GUARD, useClass: CsrfGuard },
  ],
  exports: [AuthService],
})
export class AuthModule {}
