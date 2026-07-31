import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import {
  idParamsSchema,
  workOrderAssignmentSchema,
  workOrderCreateSchema,
  workOrderStatusUpdateSchema,
  workOrderListQuerySchema,
  type IdParams,
  type WorkOrderListQuery,
} from '@faena/contracts';
import { CurrentUser } from '../auth/auth.decorators';
import type { AuthenticatedUser } from '../auth/auth.types';
import { ZodValidationPipe } from '../../common/zod-validation.pipe';
import { WorkOrdersService } from './work-orders.service';

@Controller('work-orders')
export class WorkOrdersController {
  constructor(private readonly orders: WorkOrdersService) {}

  @Get()
  list(@Query(new ZodValidationPipe(workOrderListQuerySchema)) query: WorkOrderListQuery) {
    return this.orders.list(query);
  }

  @Post()
  create(
    @Body(new ZodValidationPipe(workOrderCreateSchema))
    body: {
      title: string;
      description?: string;
      priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
      incidentId?: string;
    },
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.orders.create(body, user);
  }

  @Get(':id')
  find(@Param(new ZodValidationPipe(idParamsSchema)) params: IdParams) {
    return this.orders.findById(params.id);
  }

  // Igual que en incidentes: el esquema del cuerpo se aplica al `@Body()`. Con
  // `@UsePipes` a nivel de método también validaba `params` y devolvía 400.
  @Patch(':id/assignment')
  assign(
    @Param(new ZodValidationPipe(idParamsSchema)) params: IdParams,
    @Body(new ZodValidationPipe(workOrderAssignmentSchema)) body: { teamId: string },
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.orders.assign(params.id, body.teamId, user);
  }

  @Patch(':id/status')
  changeStatus(
    @Param(new ZodValidationPipe(idParamsSchema)) params: IdParams,
    @Body(new ZodValidationPipe(workOrderStatusUpdateSchema))
    body: { status: 'OPEN' | 'ASSIGNED' | 'IN_PROGRESS' | 'CLOSED' },
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.orders.changeStatus(params.id, body.status, user);
  }
}
