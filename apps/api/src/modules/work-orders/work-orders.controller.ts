import { Body, Controller, Get, Param, Patch, Post, Query, UsePipes } from '@nestjs/common';
import {
  paginationQuerySchema,
  workOrderAssignmentSchema,
  workOrderCreateSchema,
  workOrderStatusUpdateSchema,
} from '@faena/contracts';
import { CurrentUser } from '../auth/auth.decorators';
import type { AuthenticatedUser } from '../auth/auth.types';
import { ZodValidationPipe } from '../../common/zod-validation.pipe';
import { WorkOrdersService } from './work-orders.service';

@Controller('work-orders')
export class WorkOrdersController {
  constructor(private readonly orders: WorkOrdersService) {}

  @Get()
  @UsePipes(new ZodValidationPipe(paginationQuerySchema))
  list(
    @Query()
    query: {
      page: number;
      pageSize: number;
      status?: string;
      teamId?: string;
      incidentId?: string;
    },
  ) {
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
  find(@Param('id') id: string) {
    return this.orders.findById(id);
  }

  @Patch(':id/assignment')
  @UsePipes(new ZodValidationPipe(workOrderAssignmentSchema))
  assign(
    @Param('id') id: string,
    @Body() body: { teamId: string },
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.orders.assign(id, body.teamId, user);
  }

  @Patch(':id/status')
  @UsePipes(new ZodValidationPipe(workOrderStatusUpdateSchema))
  changeStatus(
    @Param('id') id: string,
    @Body() body: { status: 'OPEN' | 'ASSIGNED' | 'IN_PROGRESS' | 'CLOSED' },
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.orders.changeStatus(id, body.status, user);
  }
}
