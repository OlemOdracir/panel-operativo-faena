import {
  apiErrorSchema,
  incidentResponseSchema,
  userResponseSchema,
  workOrderResponseSchema,
} from '@faena/contracts';
import { clientEnvironment } from './config/environment';
import { z } from 'zod';

let csrfToken: string | undefined;

export class ApiError extends Error {
  readonly status: number;
  readonly requestId?: string;
  constructor(status: number, message: string, requestId?: string) {
    super(message);
    this.status = status;
    this.requestId = requestId;
  }
}

async function getCsrf(): Promise<string> {
  const response = await fetch(`${clientEnvironment.VITE_API_URL}/auth/csrf`, {
    credentials: 'include',
  });
  const data = (await response.json()) as { token: string };
  csrfToken = data.token;
  return data.token;
}

async function request<T>(path: string, init: RequestInit, schema: z.ZodType<T>): Promise<T> {
  const method = init.method ?? 'GET';
  if (method !== 'GET' && method !== 'HEAD') {
    if (!csrfToken) await getCsrf();
    init.headers = { ...init.headers, 'X-CSRF-Token': csrfToken ?? '' };
  }
  const response = await fetch(`${clientEnvironment.VITE_API_URL}${path}`, {
    ...init,
    credentials: 'include',
    headers: { Accept: 'application/json', ...init.headers },
  });
  if (!response.ok) {
    const raw = (await response.json().catch(() => null)) as unknown;
    const parsed = apiErrorSchema.safeParse(raw);
    throw new ApiError(
      response.status,
      parsed.success ? parsed.data.message : 'Request failed',
      parsed.success ? parsed.data.requestId : (response.headers.get('X-Request-Id') ?? undefined),
    );
  }
  if (response.status === 204) return undefined as T;
  return schema.parse(await response.json());
}

const pageSchema = <T extends z.ZodType>(item: T) =>
  z.strictObject({
    data: z.array(item),
    meta: z.object({
      page: z.number(),
      pageSize: z.number(),
      total: z.number(),
      totalPages: z.number(),
    }),
  });

export const api = {
  me: () =>
    request('/auth/me', {}, z.strictObject({ user: userResponseSchema })).then(
      (value) => value.user,
    ),
  login: (email: string, password: string) =>
    request(
      '/auth/login',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      },
      z.strictObject({ user: userResponseSchema }),
    ).then((value) => value.user),
  logout: () => request('/auth/logout', { method: 'POST' }, z.void()),
  incidents: (status = '') =>
    request(
      `/incidents?page=1&pageSize=50${status ? `&status=${encodeURIComponent(status)}` : ''}`,
      {},
      pageSchema(incidentResponseSchema),
    ),
  incident: (id: string) => request(`/incidents/${id}`, {}, incidentResponseSchema),
  incidentStatus: (id: string, status: string) =>
    request(
      `/incidents/${id}/status`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      },
      incidentResponseSchema,
    ),
  workOrders: () =>
    request('/work-orders?page=1&pageSize=50', {}, pageSchema(workOrderResponseSchema)),
  createWorkOrder: (body: {
    title: string;
    description?: string;
    priority: string;
    incidentId?: string;
  }) =>
    request(
      '/work-orders',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      },
      workOrderResponseSchema,
    ),
  assignWorkOrder: (id: string, teamId: string) =>
    request(
      `/work-orders/${id}/assignment`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamId }),
      },
      workOrderResponseSchema,
    ),
  workOrderStatus: (id: string, status: string) =>
    request(
      `/work-orders/${id}/status`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      },
      workOrderResponseSchema,
    ),
  teams: () =>
    request(
      '/teams',
      {},
      z.array(
        z.strictObject({
          id: z.string().uuid(),
          code: z.string(),
          name: z.string(),
          active: z.boolean(),
          areaId: z.string().uuid(),
        }),
      ),
    ),
  sensors: () =>
    request(
      '/sensors',
      {},
      z.array(
        z.strictObject({
          id: z.string().uuid(),
          code: z.string(),
          name: z.string(),
          unit: z.string(),
          minValue: z.coerce.number(),
          maxValue: z.coerce.number(),
          areaId: z.string().uuid(),
          area: z.strictObject({ id: z.string().uuid(), code: z.string(), name: z.string() }),
        }),
      ),
    ),
};

export type Team = Awaited<ReturnType<typeof api.teams>>[number];
