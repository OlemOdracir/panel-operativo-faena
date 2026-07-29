import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import App from './App';
import { AppProviders } from './app/providers';
import { clientEnvironment } from './config/environment';

describe('App', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders the operational dashboard for an authenticated user', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        const body = url.includes('/auth/me')
          ? {
              user: {
                id: '00000000-0000-4000-8000-000000000001',
                email: 'supervisor@faena.local',
                name: 'Supervisión',
                role: 'SUPERVISOR',
              },
            }
          : url.includes('/sensors')
            ? []
            : url.includes('/incidents')
              ? { data: [], meta: { page: 1, pageSize: 20, total: 0, totalPages: 0 } }
              : { data: [], meta: { page: 1, pageSize: 20, total: 0, totalPages: 0 } };
        return { ok: true, status: 200, json: async () => body };
      }),
    );

    render(
      <BrowserRouter>
        <AppProviders>
          <App />
        </AppProviders>
      </BrowserRouter>,
    );

    await waitFor(() =>
      expect(screen.getByRole('heading', { name: 'Estado de la faena' })).toBeInTheDocument(),
    );
    expect(screen.getByText('Supervisión · Supervisor')).toBeInTheDocument();
  });

  it('provides the query client to the component tree', () => {
    render(
      <AppProviders>
        <span>Contenido operacional</span>
      </AppProviders>,
    );
    expect(screen.getByText('Contenido operacional')).toBeInTheDocument();
  });

  it('uses a safe local API URL by default', () => {
    expect(clientEnvironment.VITE_API_URL).toBe('http://localhost:3000/api/v1');
  });

  it('shows the loading state while the session is being resolved', () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => new Promise<Response>(() => undefined)),
    );

    render(
      <BrowserRouter>
        <AppProviders>
          <App />
        </AppProviders>
      </BrowserRouter>,
    );

    expect(screen.getByRole('heading', { name: 'Cargando sesión' })).toBeInTheDocument();
  });

  it('shows an empty incident state after authentication', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        const body = url.includes('/auth/me')
          ? {
              user: {
                id: '00000000-0000-4000-8000-000000000001',
                email: 'supervisor@faena.local',
                name: 'Supervisión',
                role: 'SUPERVISOR',
              },
            }
          : { data: [], meta: { page: 1, pageSize: 20, total: 0, totalPages: 0 } };
        return { ok: true, status: 200, json: async () => body } as Response;
      }),
    );

    render(
      <MemoryRouter initialEntries={['/incidents']}>
        <AppProviders>
          <App />
        </AppProviders>
      </MemoryRouter>,
    );

    await waitFor(() => expect(screen.getByText('Sin resultados')).toBeInTheDocument());
    expect(screen.getByText('No hay incidentes para mostrar.')).toBeInTheDocument();
  });

  it('shows an API error with its request id', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        if (String(input).includes('/auth/me')) {
          return {
            ok: true,
            status: 200,
            json: async () => ({
              user: {
                id: '00000000-0000-4000-8000-000000000001',
                email: 'supervisor@faena.local',
                name: 'Supervisión',
                role: 'SUPERVISOR',
              },
            }),
          } as Response;
        }
        return {
          ok: false,
          status: 503,
          headers: new Headers({ 'X-Request-Id': 'req-test-123' }),
          json: async () => ({
            code: 'SERVICE_UNAVAILABLE',
            message: 'Servicio no disponible',
            requestId: 'req-test-123',
          }),
        } as Response;
      }),
    );

    render(
      <MemoryRouter initialEntries={['/incidents']}>
        <AppProviders>
          <App />
        </AppProviders>
      </MemoryRouter>,
    );

    await waitFor(() => expect(screen.getByText(/req-test-123/)).toBeInTheDocument(), {
      timeout: 3_000,
    });
  });

  it('renders incident detail with the order form', async () => {
    const incident = {
      id: '00000000-0000-4000-8000-000000000002',
      status: 'OPEN',
      severity: 'HIGH',
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
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.includes('/auth/me'))
          return new Response(JSON.stringify({ user: { ...userForTest, role: 'SUPERVISOR' } }));
        if (url.includes('/incidents/')) return new Response(JSON.stringify(incident));
        return new Response(
          JSON.stringify([
            {
              id: '00000000-0000-4000-8000-000000000004',
              code: 'TEAM-A',
              name: 'Equipo A',
              active: true,
              areaId: '00000000-0000-4000-8000-000000000005',
            },
          ]),
        );
      }),
    );

    render(
      <MemoryRouter initialEntries={['/incidents/00000000-0000-4000-8000-000000000002']}>
        <AppProviders>
          <App />
        </AppProviders>
      </MemoryRouter>,
    );

    await waitFor(() =>
      expect(screen.getByRole('heading', { name: /CHA-TEMP-01/ })).toBeInTheDocument(),
    );
    expect(screen.getByText('Crear orden de trabajo')).toBeInTheDocument();
  });

  it('renders the work-order board and lifecycle actions', async () => {
    const order = {
      id: '00000000-0000-4000-8000-000000000010',
      title: 'Revisar bomba',
      description: null,
      priority: 'HIGH',
      status: 'ASSIGNED',
      incidentId: null,
      teamId: '00000000-0000-4000-8000-000000000011',
      teamName: 'Mantenimiento',
      createdBy: userForTest.id,
      createdAt: '2026-01-01T00:00:00.000Z',
      assignedAt: '2026-01-01T00:00:00.000Z',
      startedAt: null,
      closedAt: null,
    };
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.includes('/auth/me'))
          return new Response(JSON.stringify({ user: { ...userForTest, role: 'SUPERVISOR' } }));
        if (url.includes('/work-orders'))
          return new Response(
            JSON.stringify({
              data: [order],
              meta: { page: 1, pageSize: 20, total: 1, totalPages: 1 },
            }),
          );
        if (url.includes('/teams'))
          return new Response(
            JSON.stringify([
              {
                id: order.teamId,
                code: 'MANT',
                name: order.teamName,
                active: true,
                areaId: 'area-1',
              },
            ]),
          );
        return new Response(JSON.stringify([]));
      }),
    );

    render(
      <MemoryRouter initialEntries={['/work-orders']}>
        <AppProviders>
          <App />
        </AppProviders>
      </MemoryRouter>,
    );

    await waitFor(() => expect(screen.getByText('Revisar bomba')).toBeInTheDocument());
    expect(screen.getByText('Asignadas')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Iniciar' })).toBeInTheDocument();
  });

  it('shows the login form when there is no active session', async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.includes('/auth/me')) return new Response('{}', { status: 401 });
        return new Response(JSON.stringify({ user: userForTest }));
      }),
    );

    render(
      <BrowserRouter>
        <AppProviders>
          <App />
        </AppProviders>
      </BrowserRouter>,
    );

    await waitFor(() =>
      expect(screen.getByRole('heading', { name: 'Ingresa a la faena' })).toBeInTheDocument(),
    );
    expect(screen.getByLabelText('Correo')).toBeInTheDocument();
    await user.type(screen.getByLabelText('Correo'), 'supervisor@faena.local');
    await user.type(screen.getByLabelText('Contraseña'), 'password');
    expect(screen.getByRole('button', { name: 'Ingresar' })).toBeEnabled();
  });

  it('offers incident acknowledgement and resolution actions', async () => {
    const user = userEvent.setup();
    const incidents = [
      {
        id: '00000000-0000-4000-8000-000000000021',
        status: 'OPEN',
        severity: 'HIGH',
        sensorId: '00000000-0000-4000-8000-000000000031',
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
      },
      {
        id: '00000000-0000-4000-8000-000000000022',
        status: 'ACKNOWLEDGED',
        severity: 'MEDIUM',
        sensorId: '00000000-0000-4000-8000-000000000032',
        sensorCode: 'MOL-VIB-01',
        areaName: 'Molienda',
        value: 12,
        minValue: 0,
        maxValue: 10,
        openedAt: '2026-01-01T00:00:00.000Z',
        acknowledgedAt: '2026-01-01T01:00:00.000Z',
        resolvedAt: null,
        acknowledgedBy: 'Supervisor',
        resolvedBy: null,
      },
    ];
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.includes('/auth/me'))
          return new Response(JSON.stringify({ user: { ...userForTest, role: 'SUPERVISOR' } }));
        if (url.includes('/incidents'))
          return new Response(
            JSON.stringify({
              data: incidents,
              meta: { page: 1, pageSize: 20, total: 2, totalPages: 1 },
            }),
          );
        return new Response(JSON.stringify([]));
      }),
    );

    render(
      <MemoryRouter initialEntries={['/incidents']}>
        <AppProviders>
          <App />
        </AppProviders>
      </MemoryRouter>,
    );

    await waitFor(() => expect(screen.getByText('CHA-TEMP-01')).toBeInTheDocument());
    expect(screen.getByRole('button', { name: 'Tomar' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Resolver' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Tomar' }));
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/incidents/00000000-0000-4000-8000-000000000021/status'),
      expect.anything(),
    );
  });

  it('allows assigning an open work order to a team', async () => {
    const user = userEvent.setup();
    const order = {
      id: '00000000-0000-4000-8000-000000000041',
      title: 'Inspeccionar correa',
      description: null,
      priority: 'MEDIUM',
      status: 'OPEN',
      incidentId: null,
      teamId: null,
      teamName: null,
      createdBy: userForTest.id,
      createdAt: '2026-01-01T00:00:00.000Z',
      assignedAt: null,
      startedAt: null,
      closedAt: null,
    };
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.includes('/auth/me'))
          return new Response(JSON.stringify({ user: { ...userForTest, role: 'SUPERVISOR' } }));
        if (url.includes('/work-orders'))
          return new Response(
            JSON.stringify({
              data: [order],
              meta: { page: 1, pageSize: 20, total: 1, totalPages: 1 },
            }),
          );
        if (url.includes('/teams'))
          return new Response(
            JSON.stringify([
              {
                id: '00000000-0000-4000-8000-000000000051',
                code: 'MANT',
                name: 'Mantenimiento',
                active: true,
                areaId: '00000000-0000-4000-8000-000000000061',
              },
            ]),
          );
        return new Response(JSON.stringify([]));
      }),
    );

    render(
      <MemoryRouter initialEntries={['/work-orders']}>
        <AppProviders>
          <App />
        </AppProviders>
      </MemoryRouter>,
    );

    await waitFor(() => expect(screen.getByText('Inspeccionar correa')).toBeInTheDocument());
    await user.selectOptions(
      screen.getByRole('combobox', { name: 'Asignar Inspeccionar correa' }),
      '00000000-0000-4000-8000-000000000051',
    );
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/work-orders/00000000-0000-4000-8000-000000000041/assignment'),
      expect.anything(),
    );
  });

  it('creates a preventive work order from the board form', async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.includes('/auth/me'))
          return new Response(JSON.stringify({ user: { ...userForTest, role: 'SUPERVISOR' } }));
        if (url.includes('/work-orders'))
          return new Response(
            JSON.stringify({ data: [], meta: { page: 1, pageSize: 20, total: 0, totalPages: 0 } }),
          );
        return new Response(JSON.stringify([]));
      }),
    );

    render(
      <MemoryRouter initialEntries={['/work-orders']}>
        <AppProviders>
          <App />
        </AppProviders>
      </MemoryRouter>,
    );

    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Nueva orden' })).toBeInTheDocument(),
    );
    await user.click(screen.getByRole('button', { name: 'Nueva orden' }));
    await user.type(screen.getByLabelText('Título'), 'Inspección preventiva');
    await user.click(screen.getByRole('button', { name: 'Crear orden' }));
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/work-orders'),
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('logs out from the authenticated shell', async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.includes('/auth/me'))
          return new Response(JSON.stringify({ user: { ...userForTest, role: 'SUPERVISOR' } }));
        return new Response('{}');
      }),
    );

    render(
      <BrowserRouter>
        <AppProviders>
          <App />
        </AppProviders>
      </BrowserRouter>,
    );

    await waitFor(() => expect(screen.getByRole('button', { name: 'Salir' })).toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: 'Salir' }));
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/auth/logout'), expect.anything());
  });
});

const userForTest = {
  id: '00000000-0000-4000-8000-000000000001',
  email: 'supervisor@faena.local',
  name: 'Supervisión',
};
