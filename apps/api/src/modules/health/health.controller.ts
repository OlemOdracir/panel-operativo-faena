import { Controller, Get } from '@nestjs/common';
import { Public } from '../auth/auth.decorators';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { HealthService, type HealthStatus } from './health.service';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Comprueba que la API está disponible' })
  @ApiOkResponse({
    description: 'La API está disponible.',
    schema: {
      example: {
        service: 'panel-operativo-faena-api',
        status: 'ok',
        timestamp: '2026-01-01T00:00:00.000Z',
        version: '0.1.0',
      },
    },
  })
  getHealth(): HealthStatus {
    return this.healthService.getStatus();
  }
}
