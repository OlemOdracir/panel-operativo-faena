import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ErrorState } from './ErrorState';

describe('ErrorState', () => {
  it('falls back to the generic message when there is no error object', () => {
    render(<ErrorState error={null} />);
    expect(screen.getByText('No se pudieron cargar los datos')).toBeInTheDocument();
  });
});
