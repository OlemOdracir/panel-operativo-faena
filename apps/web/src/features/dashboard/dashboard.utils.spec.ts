import { describe, expect, it } from 'vitest';
import type { WorkOrderResponse } from '@faena/contracts';
import { averageClosureHours } from './dashboard.utils';

function order(overrides: Partial<WorkOrderResponse>): WorkOrderResponse {
  return {
    id: '00000000-0000-4000-8000-000000000001',
    title: 'Orden',
    description: null,
    priority: 'MEDIUM',
    status: 'CLOSED',
    incidentId: null,
    teamId: null,
    teamName: null,
    createdBy: '00000000-0000-4000-8000-000000000002',
    createdAt: '2026-01-01T00:00:00.000Z',
    assignedAt: null,
    startedAt: null,
    closedAt: null,
    ...overrides,
  };
}

describe('averageClosureHours', () => {
  it('returns 0 when there are no closed orders', () => {
    expect(averageClosureHours([])).toBe(0);
    expect(averageClosureHours([order({ status: 'OPEN', closedAt: null })])).toBe(0);
  });

  it('averages the closure time in hours across closed orders', () => {
    const orders = [
      order({ createdAt: '2026-01-01T00:00:00.000Z', closedAt: '2026-01-01T02:00:00.000Z' }),
      order({ createdAt: '2026-01-01T00:00:00.000Z', closedAt: '2026-01-01T06:00:00.000Z' }),
    ];
    expect(averageClosureHours(orders)).toBe(4);
  });

  it('ignores orders without a closedAt timestamp', () => {
    const orders = [
      order({ createdAt: '2026-01-01T00:00:00.000Z', closedAt: '2026-01-01T04:00:00.000Z' }),
      order({ status: 'OPEN', createdAt: '2026-01-01T00:00:00.000Z', closedAt: null }),
    ];
    expect(averageClosureHours(orders)).toBe(4);
  });
});
