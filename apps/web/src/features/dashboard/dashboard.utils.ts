import type { WorkOrderResponse } from '@faena/contracts';

export function averageClosureHours(orders: WorkOrderResponse[]): number {
  const closed = orders.filter((item) => item.closedAt);
  if (!closed.length) return 0;
  const total = closed.reduce(
    (sum, item) =>
      sum +
      (new Date(item.closedAt ?? item.createdAt).getTime() - new Date(item.createdAt).getTime()) /
        3_600_000,
    0,
  );
  return Math.round((total / closed.length) * 10) / 10;
}
