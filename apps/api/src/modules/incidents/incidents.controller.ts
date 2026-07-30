import { Body, Controller, Get, Param, Patch, Query } from '@nestjs/common';
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
  list(@Query(new ZodValidationPipe(incidentListQuerySchema)) query: IncidentListQuery) {
    return this.incidents.list(query);
  }

  @Get(':id')
  find(@Param(new ZodValidationPipe(idParamsSchema)) params: IdParams) {
    return this.incidents.findById(params.id);
  }

  // El esquema va en el `@Body()`, no en un `@UsePipes` de método: este último
  // aplica el pipe a *todos* los argumentos, así que el esquema del cuerpo
  // también validaba `params` y la ruta respondía 400 siempre.
  @Patch(':id/status')
  changeStatus(
    @Param(new ZodValidationPipe(idParamsSchema)) params: IdParams,
    @Body(new ZodValidationPipe(incidentStatusUpdateSchema))
    body: { status: 'OPEN' | 'ACKNOWLEDGED' | 'RESOLVED' },
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.incidents.changeStatus(params.id, body.status, user);
  }
}
