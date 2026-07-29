/* eslint-disable @typescript-eslint/require-await */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { PrismaService } from '../../database/prisma.service';
import { CatalogController } from './catalog.module';

void describe('CatalogController', () => {
  void it('selects only the public sensor contract', async () => {
    let query: unknown;
    const controller = new CatalogController({
      sensor: {
        findMany: async (options: unknown) => {
          query = options;
          return [];
        },
      },
    } as unknown as PrismaService);

    await controller.sensors();

    assert.deepEqual(query, {
      select: {
        id: true,
        areaId: true,
        code: true,
        name: true,
        unit: true,
        minValue: true,
        maxValue: true,
        area: { select: { id: true, code: true, name: true } },
      },
      orderBy: { code: 'asc' },
    });
  });

  void it('does not expose timestamps from areas or teams', async () => {
    const queries: unknown[] = [];
    const controller = new CatalogController({
      area: {
        findMany: async (options: unknown) => {
          queries.push(options);
          return [];
        },
      },
      team: {
        findMany: async (options: unknown) => {
          queries.push(options);
          return [];
        },
      },
    } as unknown as PrismaService);

    await Promise.all([controller.areas(), controller.teams()]);

    assert.deepEqual(queries, [
      {
        select: { id: true, code: true, name: true },
        orderBy: { name: 'asc' },
      },
      {
        where: { active: true },
        select: { id: true, code: true, name: true, active: true, areaId: true },
        orderBy: { name: 'asc' },
      },
    ]);
  });
});
