import { Body, Controller, Get, Param, Patch, Query, UsePipes } from '@nestjs/common';
import {
  idParamsSchema,
  incidentListQuerySchema,
  incidentStatusUpdateSchema,
  type IdParams,
  type IncidentListQuery,
} from '@faena/contracts';
import { CurrentUser } from '../auth/auth.decorators';
import type { AuthenticatedUser } from '../auth/auth.types';
import { ZodValidationPipe } from '../../common/zod-validation.pipe';
import { IncidentsService } from './incidents.service';

@Controller('incidents')
export class IncidentsController {
  constructor(private readonly incidents: IncidentsService) {}

  @Get()
  @UsePipes(new ZodValidationPipe(incidentListQuerySchema))
  list(@Query() query: IncidentListQuery) {
    return this.incidents.list(query);
  }

  @Get(':id')
  find(@Param(new ZodValidationPipe(idParamsSchema)) params: IdParams) {
    return this.incidents.findById(params.id);
  }

  @Patch(':id/status')
  @UsePipes(new ZodValidationPipe(incidentStatusUpdateSchema))
  changeStatus(
    @Param(new ZodValidationPipe(idParamsSchema)) params: IdParams,
    @Body() body: { status: 'OPEN' | 'ACKNOWLEDGED' | 'RESOLVED' },
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.incidents.changeStatus(params.id, body.status, user);
  }
}
