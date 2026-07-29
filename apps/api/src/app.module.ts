import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { validateEnvironment } from './config/environment';
import { HealthModule } from './modules/health/health.module';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { CatalogModule } from './modules/catalog/catalog.module';
import { ReadingsModule } from './modules/readings/readings.module';
import { IncidentsModule } from './modules/incidents/incidents.module';
import { WorkOrdersModule } from './modules/work-orders/work-orders.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      cache: true,
      envFilePath: ['.env', '../../.env'],
      isGlobal: true,
      validate: validateEnvironment,
    }),
    ThrottlerModule.forRoot({ throttlers: [{ ttl: 60_000, limit: 100 }] }),
    DatabaseModule,
    AuthModule,
    CatalogModule,
    ReadingsModule,
    IncidentsModule,
    WorkOrdersModule,
    HealthModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
