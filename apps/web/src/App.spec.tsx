import { render, screen, waitFor } from '@testing-library/react';
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
    expect(screen.getByText('Supervisión · SUPERVISOR')).toBeInTheDocument();
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
});

const userForTest = {
  id: '00000000-0000-4000-8000-000000000001',
  email: 'supervisor@faena.local',
  name: 'Supervisión',
};
