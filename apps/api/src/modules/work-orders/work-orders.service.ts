import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { canTransitionWorkOrder, type Priority, type WorkOrderStatus } from '@faena/contracts';
import { PrismaService } from '../../database/prisma.service';
import type { Prisma } from '../../generated/prisma/client';
import type { AuthenticatedUser } from '../auth/auth.types';

type WorkOrderFilters = {
  page: number;
  pageSize: number;
  status?: string;
  teamId?: string;
  incidentId?: string;
};
type WorkOrderWithRelations = Prisma.WorkOrderGetPayload<{
  include: { team: true; createdBy: true; incident: true };
}>;

@Injectable()
export class WorkOrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async list(filters: WorkOrderFilters) {
    const statuses = filters.status?.split(',').filter(Boolean);
    const where = {
      ...(statuses?.length ? { status: { in: statuses as WorkOrderStatus[] } } : {}),
      ...(filters.teamId ? { teamId: filters.teamId } : {}),
      ...(filters.incidentId ? { incidentId: filters.incidentId } : {}),
    };
    const [data, total] = await this.prisma.$transaction([
      this.prisma.workOrder.findMany({
        where,
        include: this.include(),
        orderBy: { createdAt: 'desc' },
        skip: (filters.page - 1) * filters.pageSize,
        take: filters.pageSize,
      }),
      this.prisma.workOrder.count({ where }),
    ]);
    return {
      data: data.map((order) => this.toResponse(order)),
      meta: {
        page: filters.page,
        pageSize: filters.pageSize,
        total,
        totalPages: Math.ceil(total / filters.pageSize),
      },
    };
  }

  async findById(id: string) {
    const order = await this.prisma.workOrder.findUnique({
      where: { id },
      include: this.include(),
    });
    if (!order)
      throw new NotFoundException({
        code: 'WORK_ORDER_NOT_FOUND',
        message: 'Work order not found',
      });
    return this.toResponse(order);
  }

  async create(
    input: { title: string; description?: string; priority: Priority; incidentId?: string },
    user: AuthenticatedUser,
  ) {
    if (
      input.incidentId &&
      !(await this.prisma.incident.findUnique({ where: { id: input.incidentId } }))
    )
      throw new NotFoundException({ code: 'INCIDENT_NOT_FOUND', message: 'Incident not found' });
    const order = await this.prisma.workOrder.create({
      data: {
        title: input.title,
        description: input.description,
        priority: input.priority,
        incidentId: input.incidentId,
        createdById: user.id,
      },
      include: this.include(),
    });
    return this.toResponse(order);
  }

  async assign(id: string, teamId: string, user: AuthenticatedUser) {
    const [order, team] = await Promise.all([
      this.prisma.workOrder.findUnique({ where: { id } }),
      this.prisma.team.findUnique({ where: { id: teamId } }),
    ]);
    if (!order)
      throw new NotFoundException({
        code: 'WORK_ORDER_NOT_FOUND',
        message: 'Work order not found',
      });
    if (!team || !team.active)
      throw new NotFoundException({ code: 'TEAM_NOT_FOUND', message: 'Team not found' });
    if (order.status !== 'OPEN')
      throw new ConflictException({
        code: 'INVALID_WORK_ORDER_TRANSITION',
        message: 'Only open orders can be assigned',
      });
    await this.prisma.workOrder.update({
      where: { id },
      data: { status: 'ASSIGNED', teamId, assignedAt: new Date(), assignedById: user.id },
    });
    return this.findById(id);
  }

  async changeStatus(id: string, status: WorkOrderStatus, user: AuthenticatedUser) {
    const order = await this.prisma.workOrder.findUnique({ where: { id } });
    if (!order)
      throw new NotFoundException({
        code: 'WORK_ORDER_NOT_FOUND',
        message: 'Work order not found',
      });
    if (!canTransitionWorkOrder(order.status, status) || status === 'ASSIGNED')
      throw new ConflictException({
        code: 'INVALID_WORK_ORDER_TRANSITION',
        message: `Cannot move order from ${order.status} to ${status}`,
      });
    const now = new Date();
    const data =
      status === 'IN_PROGRESS'
        ? { status, startedAt: now, startedById: user.id }
        : { status, closedAt: now, closedById: user.id };
    await this.prisma.workOrder.update({ where: { id }, data });
    return this.findById(id);
  }

  private include() {
    return { team: true, createdBy: true, incident: true } as const;
  }

  private toResponse(order: WorkOrderWithRelations): Record<string, unknown> {
    return {
      id: order.id,
      title: order.title,
      description: order.description,
      priority: order.priority,
      status: order.status,
      incidentId: order.incidentId,
      teamId: order.teamId,
      teamName: order.team?.name ?? null,
      createdBy: order.createdBy.name,
      assignedAt: order.assignedAt?.toISOString() ?? null,
      startedAt: order.startedAt?.toISOString() ?? null,
      closedAt: order.closedAt?.toISOString() ?? null,
      createdAt: order.createdAt.toISOString(),
    };
  }
}
