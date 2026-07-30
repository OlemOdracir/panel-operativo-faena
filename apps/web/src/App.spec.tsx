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
    expect(screen.getByText('Uso interno · Operación de faena')).toBeInTheDocument();
  });

  it('keeps the dashboard focused and provides filters in the incident workspace', async () => {
    const user = userEvent.setup();
    const incidents = [
      {
        id: '11111111-0000-4000-8000-000000000071',
        status: 'OPEN',
        severity: 'CRITICAL',
        sensorId: '00000000-0000-4000-8000-000000000081',
        sensorCode: 'CHA-PRES-01',
        areaName: 'Chancado',
        value: 15,
        minValue: 2,
        maxValue: 10,
        openedAt: '2026-07-28T00:00:00.000Z',
        acknowledgedAt: null,
        resolvedAt: null,
        acknowledgedBy: null,
        resolvedBy: null,
      },
      {
        id: '22222222-0000-4000-8000-000000000072',
        status: 'ACKNOWLEDGED',
        severity: 'MEDIUM',
        sensorId: '00000000-0000-4000-8000-000000000082',
        sensorCode: 'MOL-VIB-01',
        areaName: 'Molienda',
        value: 13,
        minValue: 0,
        maxValue: 12,
        openedAt: '2026-07-28T01:00:00.000Z',
        acknowledgedAt: '2026-07-28T02:00:00.000Z',
        resolvedAt: null,
        acknowledgedBy: 'Supervisión',
        resolvedBy: null,
      },
    ];
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.includes('/auth/me'))
          return new Response(JSON.stringify({ user: { ...userForTest, role: 'SUPERVISOR' } }));
        if (url.includes('/incidents')) {
          return new Response(
            JSON.stringify({
              data: incidents,
              meta: { page: 1, pageSize: 20, total: 2, totalPages: 1 },
            }),
          );
        }
        if (url.includes('/work-orders')) {
          return new Response(
            JSON.stringify({ data: [], meta: { page: 1, pageSize: 20, total: 0, totalPages: 0 } }),
          );
        }
        if (url.includes('/areas'))
          return new Response(
            JSON.stringify([
              { id: '00000000-0000-4000-8000-000000000099', name: 'Molienda', code: 'MOL' },
            ]),
          );
        return new Response(JSON.stringify([]));
      }),
    );

    render(
      <MemoryRouter>
        <AppProviders>
          <App />
        </AppProviders>
      </MemoryRouter>,
    );

    await waitFor(() => expect(screen.getByText('Prioridades operativas')).toBeInTheDocument());
    expect(screen.queryByText('Filtrar incidentes')).not.toBeInTheDocument();
    await user.click(screen.getByRole('link', { name: /Incidentes/ }));
    await waitFor(() => expect(screen.getByText('Filtrar incidentes')).toBeInTheDocument(), {
      timeout: 5_000,
    });
    await waitFor(() =>
      expect(screen.getByRole('option', { name: 'Molienda' })).toBeInTheDocument(),
    );
    await user.selectOptions(
      screen.getByRole('combobox', { name: 'Área' }),
      '00000000-0000-4000-8000-000000000099',
    );
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('areaId=00000000-0000-4000-8000-000000000099'),
      expect.anything(),
    );
  }, 15_000);

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
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);
        if (url.includes('/auth/me'))
          return new Response(JSON.stringify({ user: { ...userForTest, role: 'SUPERVISOR' } }));
        if (init?.method === 'PATCH' && url.includes('/status'))
          return new Response(JSON.stringify({ ...incidents[0], status: 'ACKNOWLEDGED' }));
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

    await waitFor(() => expect(document.querySelectorAll('.list-row')).toHaveLength(2), {
      timeout: 5_000,
    });
    expect(screen.getByRole('button', { name: 'Tomar' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Resolver' })).toBeInTheDocument();

    const callsBefore = (fetch as ReturnType<typeof vi.fn>).mock.calls.length;
    await user.click(screen.getByRole('button', { name: 'Tomar' }));
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/incidents/00000000-0000-4000-8000-000000000021/status'),
      expect.anything(),
    );
    await waitFor(() =>
      expect((fetch as ReturnType<typeof vi.fn>).mock.calls.length).toBeGreaterThan(
        callsBefore + 1,
      ),
    );

    await user.type(screen.getByLabelText('Buscar incidente'), 'CHA');
    await waitFor(() =>
      expect(fetch).toHaveBeenCalledWith(expect.stringContaining('q=CHA'), expect.anything()),
    );
  }, 15_000);

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
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);
        if (url.includes('/auth/me'))
          return new Response(JSON.stringify({ user: { ...userForTest, role: 'SUPERVISOR' } }));
        if (init?.method === 'PATCH' && url.includes('/assignment'))
          return new Response(
            JSON.stringify({
              ...order,
              status: 'ASSIGNED',
              teamId: '00000000-0000-4000-8000-000000000051',
              teamName: 'Mantenimiento',
            }),
          );
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
    const callsBefore = (fetch as ReturnType<typeof vi.fn>).mock.calls.length;
    await user.selectOptions(
      screen.getByRole('combobox', { name: 'Asignar Inspeccionar correa' }),
      '00000000-0000-4000-8000-000000000051',
    );
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/work-orders/00000000-0000-4000-8000-000000000041/assignment'),
      expect.anything(),
    );
    await waitFor(() =>
      expect((fetch as ReturnType<typeof vi.fn>).mock.calls.length).toBeGreaterThan(
        callsBefore + 1,
      ),
    );

    const callsBeforeReset = (fetch as ReturnType<typeof vi.fn>).mock.calls.length;
    await user.selectOptions(
      screen.getByRole('combobox', { name: 'Asignar Inspeccionar correa' }),
      '',
    );
    expect((fetch as ReturnType<typeof vi.fn>).mock.calls.length).toBe(callsBeforeReset);
  });

  it('creates a preventive work order from the board form', async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);
        if (url.includes('/auth/me'))
          return new Response(JSON.stringify({ user: { ...userForTest, role: 'SUPERVISOR' } }));
        if (url.includes('/work-orders')) {
          if (init?.method === 'POST')
            return new Response(
              JSON.stringify({
                id: '44444444-0000-4000-8000-000000000490',
                title: 'Inspección preventiva',
                description: 'Revisión programada de rutina',
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
              }),
            );
          return new Response(
            JSON.stringify({ data: [], meta: { page: 1, pageSize: 20, total: 0, totalPages: 0 } }),
          );
        }
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
    await user.type(screen.getByLabelText('Descripción'), 'Revisión programada de rutina');
    await user.click(screen.getByRole('button', { name: 'Crear orden' }));
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/work-orders'),
      expect.objectContaining({ method: 'POST' }),
    );
    await waitFor(() =>
      expect(screen.queryByText('Crear orden de trabajo')).not.toBeInTheDocument(),
    );
  });

  it('logs out from the authenticated shell', async () => {
    const user = userEvent.setup();
    let loggedOut = false;
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.includes('/auth/logout')) {
          loggedOut = true;
          return new Response(null, { status: 204 });
        }
        if (url.includes('/auth/me')) {
          if (loggedOut) return new Response('{}', { status: 401 });
          return new Response(JSON.stringify({ user: { ...userForTest, role: 'SUPERVISOR' } }));
        }
        if (url.includes('/sensors')) return new Response(JSON.stringify([]));
        return new Response(
          JSON.stringify({ data: [], meta: { page: 1, pageSize: 20, total: 0, totalPages: 0 } }),
        );
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
    await user.click(screen.getByRole('button', { name: 'Salir' }));
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/auth/logout'), expect.anything());
    await waitFor(
      () => expect(screen.getByRole('heading', { name: 'Ingresa a la faena' })).toBeInTheDocument(),
      { timeout: 5_000 },
    );
  }, 15_000);

  it('logs in successfully and lands on the operational dashboard', async () => {
    const user = userEvent.setup();
    let authenticated = false;
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.includes('/auth/csrf')) return new Response(JSON.stringify({ token: 'csrf-test' }));
        if (url.includes('/auth/login')) {
          authenticated = true;
          return new Response(JSON.stringify({ user: { ...userForTest, role: 'SUPERVISOR' } }));
        }
        if (url.includes('/auth/me')) {
          if (!authenticated) return new Response('{}', { status: 401 });
          return new Response(JSON.stringify({ user: { ...userForTest, role: 'SUPERVISOR' } }));
        }
        if (url.includes('/sensors')) return new Response(JSON.stringify([]));
        return new Response(
          JSON.stringify({ data: [], meta: { page: 1, pageSize: 20, total: 0, totalPages: 0 } }),
        );
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
    await user.type(screen.getByLabelText('Contraseña'), 'super-secreto');
    await user.click(screen.getByRole('button', { name: 'Ingresar' }));

    await waitFor(() =>
      expect(screen.getByRole('heading', { name: 'Estado de la faena' })).toBeInTheDocument(),
    );
  });

  it('shows an error message when login fails', async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.includes('/auth/csrf')) return new Response(JSON.stringify({ token: 'csrf-test' }));
        if (url.includes('/auth/login'))
          return new Response(
            JSON.stringify({
              code: 'INVALID_CREDENTIALS',
              message: 'Las credenciales no son válidas.',
              requestId: 'req-login-test',
            }),
            { status: 401 },
          );
        return new Response('{}', { status: 401 });
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
    await user.type(screen.getByLabelText('Contraseña'), 'contraseña-incorrecta');
    await user.click(screen.getByRole('button', { name: 'Ingresar' }));

    await waitFor(() =>
      expect(screen.getByText('No fue posible iniciar sesión.')).toBeInTheDocument(),
    );
  });

  it('shows a dashboard error state when operational data fails to load', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.includes('/auth/me'))
          return new Response(JSON.stringify({ user: { ...userForTest, role: 'SUPERVISOR' } }));
        if (url.includes('/incidents')) return new Response('{}', { status: 503 });
        return new Response(
          JSON.stringify({ data: [], meta: { page: 1, pageSize: 20, total: 0, totalPages: 0 } }),
        );
      }),
    );

    render(
      <BrowserRouter>
        <AppProviders>
          <App />
        </AppProviders>
      </BrowserRouter>,
    );

    await waitFor(
      () => expect(screen.getByText('No se pudo completar la solicitud.')).toBeInTheDocument(),
      { timeout: 3_000 },
    );
  });

  it('shows dashboard metrics with live data and triggers a manual refresh', async () => {
    const user = userEvent.setup();
    const incidents = [
      {
        id: '11111111-0000-4000-8000-000000000110',
        status: 'OPEN',
        severity: 'CRITICAL',
        sensorId: '22222222-0000-4000-8000-000000000210',
        sensorCode: 'CHA-PRES-02',
        areaName: 'Chancado',
        value: 20,
        minValue: 2,
        maxValue: 10,
        openedAt: '2026-01-01T00:00:00.000Z',
        acknowledgedAt: null,
        resolvedAt: null,
        acknowledgedBy: null,
        resolvedBy: null,
      },
    ];
    const orders = [
      {
        id: '44444444-0000-4000-8000-000000000420',
        title: 'Reemplazar filtro',
        description: null,
        priority: 'HIGH',
        status: 'IN_PROGRESS',
        incidentId: null,
        teamId: null,
        teamName: null,
        createdBy: userForTest.id,
        createdAt: '2026-01-01T00:00:00.000Z',
        assignedAt: '2026-01-01T00:10:00.000Z',
        startedAt: '2026-01-01T00:20:00.000Z',
        closedAt: null,
      },
    ];
    const sensors = [
      {
        id: '22222222-0000-4000-8000-000000000210',
        code: 'CHA-PRES-02',
        name: 'Presión chancador',
        unit: 'psi',
        minValue: 2,
        maxValue: 10,
        areaId: '33333333-0000-4000-8000-000000000301',
        area: {
          id: '33333333-0000-4000-8000-000000000301',
          code: 'CHA',
          name: 'Chancado',
        },
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
              meta: { page: 1, pageSize: 20, total: 1, totalPages: 1 },
            }),
          );
        if (url.includes('/work-orders'))
          return new Response(
            JSON.stringify({
              data: orders,
              meta: { page: 1, pageSize: 20, total: 1, totalPages: 1 },
            }),
          );
        if (url.includes('/sensors')) return new Response(JSON.stringify(sensors));
        return new Response(JSON.stringify([]));
      }),
    );

    render(
      <BrowserRouter>
        <AppProviders>
          <App />
        </AppProviders>
      </BrowserRouter>,
    );

    await waitFor(() => expect(screen.getByText('Reemplazar filtro')).toBeInTheDocument());
    expect(screen.getByText('1 en progreso')).toBeInTheDocument();

    const callsBefore = (fetch as ReturnType<typeof vi.fn>).mock.calls.length;
    await user.click(screen.getByRole('button', { name: 'Actualizar' }));
    await waitFor(() =>
      expect((fetch as ReturnType<typeof vi.fn>).mock.calls.length).toBeGreaterThan(callsBefore),
    );
  });

  it('acknowledges an open incident and creates a work order from its detail page', async () => {
    const user = userEvent.setup();
    const incident = {
      id: '11111111-0000-4000-8000-000000000111',
      status: 'OPEN',
      severity: 'HIGH',
      sensorId: '22222222-0000-4000-8000-000000000211',
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
    const team = {
      id: '55555555-0000-4000-8000-000000000509',
      code: 'MANT',
      name: 'Mantenimiento',
      active: true,
      areaId: '33333333-0000-4000-8000-000000000302',
    };
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);
        if (url.includes('/auth/me'))
          return new Response(JSON.stringify({ user: { ...userForTest, role: 'SUPERVISOR' } }));
        if (init?.method === 'POST' && url.includes('/work-orders'))
          return new Response(
            JSON.stringify({
              id: '44444444-0000-4000-8000-000000000499',
              title: 'Reparar sensor de temperatura',
              description: null,
              priority: 'MEDIUM',
              status: 'OPEN',
              incidentId: incident.id,
              teamId: null,
              teamName: null,
              createdBy: userForTest.id,
              createdAt: '2026-01-01T00:00:00.000Z',
              assignedAt: null,
              startedAt: null,
              closedAt: null,
            }),
          );
        if (url.includes('/incidents/')) return new Response(JSON.stringify(incident));
        if (url.includes('/teams')) return new Response(JSON.stringify([team]));
        return new Response(JSON.stringify([]));
      }),
    );

    render(
      <MemoryRouter initialEntries={[`/incidents/${incident.id}`]}>
        <AppProviders>
          <App />
        </AppProviders>
      </MemoryRouter>,
    );

    await waitFor(() =>
      expect(screen.getByRole('heading', { name: /CHA-TEMP-01/ })).toBeInTheDocument(),
    );

    await user.click(screen.getByRole('button', { name: 'Tomar incidente' }));
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining(`/incidents/${incident.id}/status`),
      expect.anything(),
    );

    await user.type(screen.getByLabelText('Título'), 'Reparar sensor de temperatura');
    await user.click(screen.getByRole('button', { name: 'Crear orden' }));
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/work-orders'),
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('resolves an acknowledged incident from its detail page', async () => {
    const user = userEvent.setup();
    const incident = {
      id: '11111111-0000-4000-8000-000000000112',
      status: 'ACKNOWLEDGED',
      severity: 'MEDIUM',
      sensorId: '22222222-0000-4000-8000-000000000212',
      sensorCode: 'MOL-VIB-01',
      areaName: 'Molienda',
      value: 11,
      minValue: 0,
      maxValue: 10,
      openedAt: '2026-01-01T00:00:00.000Z',
      acknowledgedAt: '2026-01-01T01:00:00.000Z',
      resolvedAt: null,
      acknowledgedBy: 'Supervisión',
      resolvedBy: null,
    };
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.includes('/auth/me'))
          return new Response(JSON.stringify({ user: { ...userForTest, role: 'SUPERVISOR' } }));
        if (url.includes('/incidents/')) return new Response(JSON.stringify(incident));
        return new Response(JSON.stringify([]));
      }),
    );

    render(
      <MemoryRouter initialEntries={[`/incidents/${incident.id}`]}>
        <AppProviders>
          <App />
        </AppProviders>
      </MemoryRouter>,
    );

    await waitFor(() =>
      expect(screen.getByRole('heading', { name: /MOL-VIB-01/ })).toBeInTheDocument(),
    );

    await user.click(screen.getByRole('button', { name: 'Resolver incidente' }));
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining(`/incidents/${incident.id}/status`),
      expect.anything(),
    );
  });

  it('shows an error state on the incident detail page when it fails to load', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.includes('/auth/me'))
          return new Response(JSON.stringify({ user: { ...userForTest, role: 'SUPERVISOR' } }));
        if (url.includes('/incidents/')) return new Response('{}', { status: 503 });
        return new Response(JSON.stringify([]));
      }),
    );

    render(
      <MemoryRouter initialEntries={['/incidents/11111111-0000-4000-8000-000000000113']}>
        <AppProviders>
          <App />
        </AppProviders>
      </MemoryRouter>,
    );

    await waitFor(
      () => expect(screen.getByText('No se pudo completar la solicitud.')).toBeInTheDocument(),
      { timeout: 3_000 },
    );
  });

  it('clears filters and narrows incidents by status, severity, and sensor', async () => {
    const user = userEvent.setup();
    const sensorId1 = '22222222-0000-4000-8000-000000000201';
    const areaId1 = '33333333-0000-4000-8000-000000000301';
    const acknowledgedIncidentId = '11111111-0000-4000-8000-000000000102';
    const incidents = [
      {
        id: '11111111-0000-4000-8000-000000000101',
        status: 'OPEN',
        severity: 'CRITICAL',
        sensorId: sensorId1,
        sensorCode: 'CHA-PRES-01',
        areaName: 'Chancado',
        value: 15,
        minValue: 2,
        maxValue: 10,
        openedAt: '2026-01-01T00:00:00.000Z',
        acknowledgedAt: null,
        resolvedAt: null,
        acknowledgedBy: null,
        resolvedBy: null,
      },
      {
        id: acknowledgedIncidentId,
        status: 'ACKNOWLEDGED',
        severity: 'LOW',
        sensorId: '22222222-0000-4000-8000-000000000202',
        sensorCode: 'MOL-VIB-01',
        areaName: 'Molienda',
        value: 5,
        minValue: 0,
        maxValue: 12,
        openedAt: '2026-01-01T01:00:00.000Z',
        acknowledgedAt: '2026-01-01T02:00:00.000Z',
        resolvedAt: null,
        acknowledgedBy: 'Supervisión',
        resolvedBy: null,
      },
      {
        id: '11111111-0000-4000-8000-000000000103',
        status: 'RESOLVED',
        severity: 'MEDIUM',
        sensorId: sensorId1,
        sensorCode: 'CHA-PRES-01',
        areaName: 'Chancado',
        value: 8,
        minValue: 2,
        maxValue: 10,
        openedAt: '2026-01-01T02:00:00.000Z',
        acknowledgedAt: '2026-01-01T02:30:00.000Z',
        resolvedAt: '2026-01-01T03:00:00.000Z',
        acknowledgedBy: 'Supervisión',
        resolvedBy: 'Supervisión',
      },
    ];
    const sensors = [
      {
        id: sensorId1,
        code: 'CHA-PRES-01',
        name: 'Presión chancador',
        unit: 'psi',
        minValue: 2,
        maxValue: 10,
        areaId: areaId1,
        area: { id: areaId1, code: 'CHA', name: 'Chancado' },
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
              meta: { page: 1, pageSize: 20, total: 3, totalPages: 1 },
            }),
          );
        if (url.includes('/sensors')) return new Response(JSON.stringify(sensors));
        if (url.includes('/areas'))
          return new Response(JSON.stringify([{ id: areaId1, code: 'CHA', name: 'Chancado' }]));
        return new Response(
          JSON.stringify({ data: [], meta: { page: 1, pageSize: 20, total: 0, totalPages: 0 } }),
        );
      }),
    );

    render(
      <MemoryRouter initialEntries={['/incidents']}>
        <AppProviders>
          <App />
        </AppProviders>
      </MemoryRouter>,
    );

    await waitFor(() => expect(document.querySelectorAll('.list-row')).toHaveLength(3));

    await user.click(screen.getByRole('button', { name: 'Resolver' }));
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining(`/incidents/${acknowledgedIncidentId}/status`),
      expect.anything(),
    );

    await user.selectOptions(screen.getByRole('combobox', { name: 'Estado' }), 'OPEN');
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('status=OPEN'), expect.anything());

    await user.selectOptions(screen.getByRole('combobox', { name: 'Severidad' }), 'CRITICAL');
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('severity=CRITICAL'),
      expect.anything(),
    );

    await user.selectOptions(screen.getByRole('combobox', { name: 'Sensor' }), sensorId1);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining(`sensorId=${sensorId1}`),
      expect.anything(),
    );

    await user.click(screen.getByRole('button', { name: 'Limpiar filtros' }));
    expect(screen.getByRole('combobox', { name: 'Estado' })).toHaveValue('');
  });

  it('supports the work-order board filters, lifecycle transitions, and form cancellation', async () => {
    const user = userEvent.setup();
    const teamId1 = '55555555-0000-4000-8000-000000000501';
    const openOrder = {
      id: '44444444-0000-4000-8000-000000000401',
      title: 'Reparar cinta',
      description: null,
      priority: 'LOW',
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
    const assignedOrder = {
      id: '44444444-0000-4000-8000-000000000402',
      title: 'Lubricar rodillos',
      description: null,
      priority: 'MEDIUM',
      status: 'ASSIGNED',
      incidentId: null,
      teamId: teamId1,
      teamName: 'Mantenimiento',
      createdBy: userForTest.id,
      createdAt: '2026-01-01T00:00:00.000Z',
      assignedAt: '2026-01-01T00:30:00.000Z',
      startedAt: null,
      closedAt: null,
    };
    const inProgressOrder = {
      id: '44444444-0000-4000-8000-000000000403',
      title: 'Cambiar rodamiento',
      description: null,
      priority: 'HIGH',
      status: 'IN_PROGRESS',
      incidentId: null,
      teamId: teamId1,
      teamName: 'Mantenimiento',
      createdBy: userForTest.id,
      createdAt: '2026-01-01T00:00:00.000Z',
      assignedAt: '2026-01-01T00:30:00.000Z',
      startedAt: '2026-01-01T01:00:00.000Z',
      closedAt: null,
    };
    const closedOrder = {
      id: '44444444-0000-4000-8000-000000000404',
      title: 'Calibrar sensor',
      description: null,
      priority: 'CRITICAL',
      status: 'CLOSED',
      incidentId: null,
      teamId: teamId1,
      teamName: 'Mantenimiento',
      createdBy: userForTest.id,
      createdAt: '2026-01-01T00:00:00.000Z',
      assignedAt: '2026-01-01T00:30:00.000Z',
      startedAt: '2026-01-01T01:00:00.000Z',
      closedAt: '2026-01-01T05:00:00.000Z',
    };
    const orders = [openOrder, assignedOrder, inProgressOrder, closedOrder];
    const team = {
      id: teamId1,
      code: 'MANT',
      name: 'Mantenimiento',
      active: true,
      areaId: '33333333-0000-4000-8000-000000000302',
    };

    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);
        if (url.includes('/auth/me'))
          return new Response(JSON.stringify({ user: { ...userForTest, role: 'SUPERVISOR' } }));
        if (init?.method === 'PATCH' && url.includes('/assignment'))
          return new Response(
            JSON.stringify({ ...openOrder, status: 'ASSIGNED', teamId: team.id }),
          );
        if (init?.method === 'PATCH' && url.includes('/status'))
          return new Response(JSON.stringify({ ...assignedOrder, status: 'IN_PROGRESS' }));
        if (url.includes('/work-orders'))
          return new Response(
            JSON.stringify({
              data: orders,
              meta: { page: 1, pageSize: 20, total: orders.length, totalPages: 1 },
            }),
          );
        if (url.includes('/teams')) return new Response(JSON.stringify([team]));
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

    await waitFor(() => expect(screen.getByText('Reparar cinta')).toBeInTheDocument());

    await user.selectOptions(
      screen.getByRole('combobox', { name: `Asignar ${openOrder.title}` }),
      team.id,
    );
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining(`/work-orders/${openOrder.id}/assignment`),
      expect.anything(),
    );

    const callsBeforeStart = (fetch as ReturnType<typeof vi.fn>).mock.calls.length;
    await user.click(screen.getByRole('button', { name: 'Iniciar' }));
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining(`/work-orders/${assignedOrder.id}/status`),
      expect.anything(),
    );
    await waitFor(() =>
      expect((fetch as ReturnType<typeof vi.fn>).mock.calls.length).toBeGreaterThan(
        callsBeforeStart + 1,
      ),
    );

    await user.click(screen.getByRole('button', { name: 'Cerrar' }));
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining(`/work-orders/${inProgressOrder.id}/status`),
      expect.anything(),
    );

    await user.type(screen.getByLabelText('Buscar'), 'rodamiento');

    await user.selectOptions(screen.getByRole('combobox', { name: 'Estado' }), 'CLOSED');
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('status=CLOSED'), expect.anything());

    await user.selectOptions(screen.getByRole('combobox', { name: 'Prioridad' }), 'CRITICAL');
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('priority=CRITICAL'),
      expect.anything(),
    );

    await user.selectOptions(screen.getByRole('combobox', { name: 'Equipo' }), team.id);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining(`teamId=${team.id}`),
      expect.anything(),
    );

    await user.click(screen.getByRole('button', { name: 'Limpiar filtros' }));
    expect(screen.getByRole('combobox', { name: 'Estado' })).toHaveValue('');

    await user.click(screen.getByRole('button', { name: 'Nueva orden' }));
    expect(screen.getByText('Crear orden de trabajo')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(screen.queryByText('Crear orden de trabajo')).not.toBeInTheDocument();
  }, 15_000);

  it('collapses the desktop navigation drawer', async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.includes('/auth/me'))
          return new Response(JSON.stringify({ user: { ...userForTest, role: 'SUPERVISOR' } }));
        if (url.includes('/sensors')) return new Response(JSON.stringify([]));
        return new Response(
          JSON.stringify({ data: [], meta: { page: 1, pageSize: 20, total: 0, totalPages: 0 } }),
        );
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

    await user.click(screen.getByRole('button', { name: 'Colapsar menú' }));
    expect(screen.getByRole('button', { name: 'Expandir menú' })).toBeInTheDocument();
  });

  it('opens the mobile navigation drawer and closes it from the backdrop', async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      'matchMedia',
      vi.fn().mockImplementation((query: string) => ({
        matches: true,
        media: query,
        onchange: null,
        addListener: () => undefined,
        removeListener: () => undefined,
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
        dispatchEvent: () => false,
      })),
    );
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.includes('/auth/me'))
          return new Response(JSON.stringify({ user: { ...userForTest, role: 'SUPERVISOR' } }));
        if (url.includes('/sensors')) return new Response(JSON.stringify([]));
        return new Response(
          JSON.stringify({ data: [], meta: { page: 1, pageSize: 20, total: 0, totalPages: 0 } }),
        );
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

    await user.click(screen.getByRole('button', { name: 'Abrir menú' }));
    expect(screen.getByRole('navigation', { name: 'Navegación principal' })).toBeVisible();

    await user.click(screen.getByRole('button', { name: 'Colapsar menú' }));
    await waitFor(() =>
      expect(
        screen.queryByRole('navigation', { name: 'Navegación principal' }),
      ).not.toBeInTheDocument(),
    );

    await user.click(screen.getByRole('button', { name: 'Abrir menú' }));
    expect(screen.getByRole('navigation', { name: 'Navegación principal' })).toBeVisible();

    const backdrop = document.querySelector('.MuiBackdrop-root');
    expect(backdrop).not.toBeNull();
    await user.click(backdrop as Element);
  });
});

const userForTest = {
  id: '00000000-0000-4000-8000-000000000001',
  email: 'supervisor@faena.local',
  name: 'Supervisión',
};
