import { afterEach, describe, expect, it, vi } from 'vitest';
import { api, ApiError } from './api';

const user = {
  id: '00000000-0000-4000-8000-000000000001',
  email: 'admin@faena.local',
  name: 'Administración',
  role: 'ADMIN',
};
const incident = {
  id: '00000000-0000-4000-8000-000000000002',
  status: 'OPEN',
  sensorId: '00000000-0000-4000-8000-000000000003',
  sensorCode: 'CHA-TEMP-01',
  areaName: 'Chancado',
  value: 90,
  minValue: 0,
  maxValue: 80,
  openedAt: '2026-01-01T00:00:00.000Z',
  acknowledgedAt: null,
  resolvedAt: null,
  acknowledgedBy: null,
  resolvedBy: null,
};
const order = {
  id: '00000000-0000-4000-8000-000000000004',
  title: 'Revisar sensor',
  description: null,
  priority: 'HIGH',
  status: 'OPEN',
  incidentId: null,
  teamId: null,
  teamName: null,
  createdBy: 'Administración',
  assignedAt: null,
  startedAt: null,
  closedAt: null,
  createdAt: '2026-01-01T00:00:00.000Z',
};
const page = (data: unknown[]) => ({
  data,
  meta: { page: 1, pageSize: 50, total: data.length, totalPages: 1 },
});

describe('api client', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('calls authenticated resources and sends CSRF on mutations', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL, _init?: RequestInit) => {
      const url = String(input);
      if (url.endsWith('/auth/csrf')) return new Response(JSON.stringify({ token: 'csrf-token' }));
      if (url.endsWith('/auth/me')) return new Response(JSON.stringify({ user }));
      if (url.endsWith('/auth/login')) return new Response(JSON.stringify({ user }));
      if (url.endsWith('/auth/logout')) return new Response(null, { status: 204 });
      if (url.includes('/incidents?')) return new Response(JSON.stringify(page([incident])));
      if (url.includes('/incidents/') || url.includes('/work-orders/'))
        return new Response(JSON.stringify(url.includes('/incidents/') ? incident : order));
      if (url.includes('/work-orders?')) return new Response(JSON.stringify(page([order])));
      if (url.endsWith('/work-orders')) return new Response(JSON.stringify(order));
      return new Response(
        JSON.stringify([{ id: user.id, code: 'TEAM-A', name: 'Equipo A', active: true }]),
      );
    });
    vi.stubGlobal('fetch', fetchMock);

    expect(await api.me()).toEqual(user);
    expect(await api.login(user.email, 'secret')).toEqual(user);
    expect((await api.incidents('OPEN')).data).toHaveLength(1);
    expect(await api.incidentStatus(incident.id, 'ACKNOWLEDGED')).toEqual(incident);
    expect((await api.workOrders()).data).toHaveLength(1);
    expect(await api.createWorkOrder({ title: order.title, priority: order.priority })).toEqual(
      order,
    );
    expect(await api.assignWorkOrder(order.id, user.id)).toEqual(order);
    expect(await api.workOrderStatus(order.id, 'CLOSED')).toEqual(order);
    expect(await api.teams()).toHaveLength(1);
    await api.logout();

    const mutation = fetchMock.mock.calls.find(([, request]) => request?.method === 'POST');
    expect(mutation?.[1]?.headers).toMatchObject({ 'X-CSRF-Token': 'csrf-token' });
  });

  it('normalizes API errors and preserves request ids', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(
            JSON.stringify({ code: 'FORBIDDEN', message: 'No permitido', requestId: 'req-1' }),
            {
              status: 403,
              headers: { 'X-Request-Id': 'req-1' },
            },
          ),
      ),
    );

    await expect(api.me()).rejects.toBeInstanceOf(ApiError);
    try {
      await api.me();
    } catch (error) {
      expect(error).toMatchObject({ status: 403, message: 'No permitido', requestId: 'req-1' });
    }
  });
});
