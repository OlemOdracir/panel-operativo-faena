import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AppProviders } from './app/providers';
import { clientEnvironment } from './config/environment';

describe('App', () => {
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
});
