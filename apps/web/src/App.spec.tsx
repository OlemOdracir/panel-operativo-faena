import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import App from './App';
import { AppProviders } from './app/providers';
import { clientEnvironment } from './config/environment';

describe('App', () => {
  it('explains the purpose of the operational panel', () => {
    render(<App />);

    expect(
      screen.getByRole('heading', {
        name: /una vista operacional, desde los sensores/i,
      }),
    ).toBeInTheDocument();
    expect(screen.getByText('PostgreSQL', { exact: false })).toBeInTheDocument();
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
