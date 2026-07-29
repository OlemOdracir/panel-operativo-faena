import { Body, Controller, Get, Param, Patch, Query, UsePipes } from '@nestjs/common';
import { incidentStatusUpdateSchema, paginationQuerySchema } from '@faena/contracts';
import { CurrentUser } from '../auth/auth.decorators';
import type { AuthenticatedUser } from '../auth/auth.types';
import { ZodValidationPipe } from '../../common/zod-validation.pipe';
import { IncidentsService } from './incidents.service';

@Controller('incidents')
export class IncidentsController {
  constructor(private readonly incidents: IncidentsService) {}

  @Get()
  @UsePipes(new ZodValidationPipe(paginationQuerySchema))
  list(
    @Query()
    query: {
      page: number;
      pageSize: number;
      status?: string;
      areaId?: string;
      sensorId?: string;
    },
  ) {
    return this.incidents.list(query);
  }

  @Get(':id')
  find(@Param('id') id: string) {
    return this.incidents.findById(id);
  }

  @Patch(':id/status')
  @UsePipes(new ZodValidationPipe(incidentStatusUpdateSchema))
  changeStatus(
    @Param('id') id: string,
    @Body() body: { status: 'OPEN' | 'ACKNOWLEDGED' | 'RESOLVED' },
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.incidents.changeStatus(id, body.status, user);
  }
}
