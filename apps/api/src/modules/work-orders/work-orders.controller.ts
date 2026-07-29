import { Body, Controller, Get, Param, Patch, Post, Query, UsePipes } from '@nestjs/common';
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
  @UsePipes(new ZodValidationPipe(workOrderListQuerySchema))
  list(@Query() query: WorkOrderListQuery) {
    return this.orders.list(query);
  }

  @Post()
  @UsePipes(new ZodValidationPipe(workOrderCreateSchema))
  create(
    @Body()
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

  @Patch(':id/assignment')
  @UsePipes(new ZodValidationPipe(workOrderAssignmentSchema))
  assign(
    @Param(new ZodValidationPipe(idParamsSchema)) params: IdParams,
    @Body() body: { teamId: string },
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.orders.assign(params.id, body.teamId, user);
  }

  @Patch(':id/status')
  @UsePipes(new ZodValidationPipe(workOrderStatusUpdateSchema))
  changeStatus(
    @Param(new ZodValidationPipe(idParamsSchema)) params: IdParams,
    @Body() body: { status: 'OPEN' | 'ASSIGNED' | 'IN_PROGRESS' | 'CLOSED' },
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.orders.changeStatus(params.id, body.status, user);
  }
}
