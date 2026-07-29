import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { PrismaService } from '../src/database/prisma.service';

const enabled = process.env.RUN_DB_INTEGRATION === 'true';

void describe('PostgreSQL integration', { skip: !enabled }, () => {
  let prisma: PrismaService;

  void before(async () => {
    prisma = new PrismaService();
    await prisma.onModuleInit();
  });

  void it('exposes the seeded operational catalog and readings', async () => {
    const [areas, sensors, readings, incidents, teams, users, workOrders] = await Promise.all([
      prisma.area.count(),
      prisma.sensor.count(),
      prisma.reading.count(),
      prisma.incident.count(),
      prisma.team.count(),
      prisma.user.count(),
      prisma.workOrder.count(),
    ]);

    assert.equal(areas, 3);
    assert.equal(sensors, 6);
    assert.ok(readings >= 72);
    assert.ok(incidents >= 6);
    assert.equal(teams, 2);
    assert.equal(users, 2);
    assert.ok(workOrders >= 4);
  });

  void it('keeps the partial active-incident uniqueness invariant', async () => {
    const active = await prisma.incident.groupBy({
      by: ['sensorId'],
      where: { status: { in: ['OPEN', 'ACKNOWLEDGED'] } },
      _count: { sensorId: true },
    });

    assert.ok(active.every((item) => item._count.sensorId === 1));
  });

  void after(async () => {
    await prisma.onModuleDestroy();
  });
});
