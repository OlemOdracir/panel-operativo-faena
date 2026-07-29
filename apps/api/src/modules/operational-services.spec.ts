/* eslint-disable @typescript-eslint/require-await, @typescript-eslint/no-unnecessary-type-assertion */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { IncidentsService } from './incidents/incidents.service';
import { ReadingsService } from './readings/readings.service';
import { WorkOrdersService } from './work-orders/work-orders.service';
import type { PrismaService } from '../database/prisma.service';

const user = {
  id: '00000000-0000-4000-8000-000000000001',
  email: 'supervisor@faena.local',
  name: 'Supervisor',
  role: 'SUPERVISOR' as const,
};
const sensor = {
  id: '00000000-0000-4000-8000-000000000002',
  code: 'TEMP-01',
  minValue: 10,
  maxValue: 80,
  area: { name: 'Molienda' },
};

void describe('application services', () => {
  void it('stores an in-range reading without opening an incident', async () => {
    const tx = {
      sensor: { findUnique: async () => sensor },
      reading: {
        create: async () => ({
          id: 'reading-1',
          sensorId: sensor.id,
          value: 40,
          measuredAt: new Date('2026-01-01T00:00:00Z'),
        }),
      },
      incident: { findFirst: async () => null },
      $executeRaw: async () => 0,
    };
    const service = new ReadingsService({
      $transaction: async (callback: (value: typeof tx) => unknown) => callback(tx),
    } as unknown as PrismaService);
    const result = await service.create({
      sensorId: sensor.id,
      value: 40,
      measuredAt: '2026-01-01T00:00:00Z',
    });
    assert.equal(result.incidentId, null);
    assert.equal(result.incidentCreated, false);
  });

  void it('opens one incident for an out-of-range reading', async () => {
    const tx = {
      sensor: { findUnique: async () => sensor },
      reading: {
        create: async () => ({
          id: 'reading-2',
          sensorId: sensor.id,
          value: 99,
          measuredAt: new Date('2026-01-01T00:00:00Z'),
        }),
      },
      incident: { findFirst: async () => ({ id: 'incident-1' }) },
      $executeRaw: async () => 1,
    };
    const service = new ReadingsService({
      $transaction: async (callback: (value: typeof tx) => unknown) => callback(tx),
    } as unknown as PrismaService);
    const result = await service.create({
      sensorId: sensor.id,
      value: 99,
      measuredAt: '2026-01-01T00:00:00Z',
    });
    assert.equal(result.incidentId, 'incident-1');
    assert.equal(result.incidentCreated, true);
  });

  void it('changes an incident status using the authenticated actor', async () => {
    const incident = { id: 'incident-1', status: 'OPEN' as const };
    const full = {
      id: incident.id,
      status: 'ACKNOWLEDGED' as const,
      sensorId: sensor.id,
      sensor,
      triggerReading: { value: 99 },
      openedAt: new Date(),
      acknowledgedAt: new Date(),
      resolvedAt: null,
      acknowledgedBy: user,
      resolvedBy: null,
    };
    let findCalls = 0;
    const prisma = {
      incident: {
        findUnique: async () => {
          findCalls += 1;
          return findCalls === 1 ? incident : full;
        },
        update: async () => full,
      },
    };
    const service = new IncidentsService(prisma as unknown as PrismaService);
    const result = await service.changeStatus(incident.id, 'ACKNOWLEDGED', user);
    assert.equal(result.status, 'ACKNOWLEDGED');
  });

  void it('creates and advances a work order through its lifecycle', async () => {
    const team = { id: 'team-1', name: 'Mantenimiento', active: true };
    const base = {
      id: 'order-1',
      title: 'Inspección',
      description: null,
      priority: 'HIGH' as const,
      status: 'OPEN' as const,
      incidentId: null,
      teamId: null,
      createdById: user.id,
      assignedAt: null,
      startedAt: null,
      closedAt: null,
      createdAt: new Date(),
    };
    let current = base;
    const prisma = {
      incident: { findUnique: async () => null },
      team: { findUnique: async () => team },
      workOrder: {
        create: async () => ({ ...current, createdBy: user, team: null, incident: null }),
        findUnique: async () => ({
          ...current,
          createdBy: user,
          team: current.teamId ? team : null,
          incident: null,
        }),
        update: async ({ data }: { data: Record<string, unknown> }) => {
          current = { ...current, ...data } as typeof current;
          return {
            ...current,
            createdBy: user,
            team: current.teamId ? team : null,
            incident: null,
          };
        },
      },
    };
    const service = new WorkOrdersService(prisma as unknown as PrismaService);
    const created = await service.create({ title: 'Inspección', priority: 'HIGH' }, user);
    assert.equal(created.status, 'OPEN');
    const assigned = await service.assign('order-1', team.id, user);
    assert.equal(assigned.status, 'ASSIGNED');
    const started = await service.changeStatus('order-1', 'IN_PROGRESS', user);
    assert.equal(started.status, 'IN_PROGRESS');
    const closed = await service.changeStatus('order-1', 'CLOSED', user);
    assert.equal(closed.status, 'CLOSED');
  });
});
