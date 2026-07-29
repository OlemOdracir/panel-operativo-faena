import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { canTransitionIncident, incidentStatusSchema, type IncidentStatus } from '@faena/contracts';
import { PrismaService } from '../../database/prisma.service';
import type { Prisma } from '../../generated/prisma/client';
import type { AuthenticatedUser } from '../auth/auth.types';

type IncidentFilters = {
  page: number;
  pageSize: number;
  status?: string;
  areaId?: string;
  sensorId?: string;
};
type IncidentWithRelations = Prisma.IncidentGetPayload<{
  include: {
    sensor: { include: { area: true } };
    triggerReading: true;
    acknowledgedBy: true;
    resolvedBy: true;
  };
}>;

@Injectable()
export class IncidentsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(filters: IncidentFilters) {
    const status = filters.status ? incidentStatusSchema.parse(filters.status) : undefined;
    const where = {
      ...(status ? { status } : {}),
      ...(filters.sensorId ? { sensorId: filters.sensorId } : {}),
      ...(filters.areaId ? { sensor: { areaId: filters.areaId } } : {}),
    };
    const [data, total] = await this.prisma.$transaction([
      this.prisma.incident.findMany({
        where,
        include: this.include(),
        orderBy: { openedAt: 'desc' },
        skip: (filters.page - 1) * filters.pageSize,
        take: filters.pageSize,
      }),
      this.prisma.incident.count({ where }),
    ]);
    return {
      data: data.map((incident) => this.toResponse(incident)),
      meta: {
        page: filters.page,
        pageSize: filters.pageSize,
        total,
        totalPages: Math.ceil(total / filters.pageSize),
      },
    };
  }

  async findById(id: string) {
    const incident = await this.prisma.incident.findUnique({
      where: { id },
      include: this.include(),
    });
    if (!incident)
      throw new NotFoundException({ code: 'INCIDENT_NOT_FOUND', message: 'Incident not found' });
    return this.toResponse(incident);
  }

  async changeStatus(id: string, status: IncidentStatus, user: AuthenticatedUser) {
    const current = await this.prisma.incident.findUnique({ where: { id } });
    if (!current)
      throw new NotFoundException({ code: 'INCIDENT_NOT_FOUND', message: 'Incident not found' });
    if (!canTransitionIncident(current.status, status))
      throw new ConflictException({
        code: 'INVALID_INCIDENT_TRANSITION',
        message: `Cannot move incident from ${current.status} to ${status}`,
      });
    const now = new Date();
    await this.prisma.incident.update({
      where: { id },
      data:
        status === 'ACKNOWLEDGED'
          ? { status: 'ACKNOWLEDGED', acknowledgedAt: now, acknowledgedById: user.id }
          : { status: 'RESOLVED', resolvedAt: now, resolvedById: user.id },
    });
    return this.findById(id);
  }

  private include() {
    return {
      sensor: { include: { area: true } },
      triggerReading: true,
      acknowledgedBy: true,
      resolvedBy: true,
    } as const;
  }

  private toResponse(typed: IncidentWithRelations): Record<string, unknown> {
    return {
      id: typed.id,
      status: typed.status,
      sensorId: typed.sensorId,
      sensorCode: typed.sensor.code,
      areaName: typed.sensor.area.name,
      value: Number(typed.triggerReading.value),
      minValue: Number(typed.sensor.minValue),
      maxValue: Number(typed.sensor.maxValue),
      openedAt: typed.openedAt.toISOString(),
      acknowledgedAt: typed.acknowledgedAt?.toISOString() ?? null,
      resolvedAt: typed.resolvedAt?.toISOString() ?? null,
      acknowledgedBy: typed.acknowledgedBy?.name ?? null,
      resolvedBy: typed.resolvedBy?.name ?? null,
    };
  }
}
