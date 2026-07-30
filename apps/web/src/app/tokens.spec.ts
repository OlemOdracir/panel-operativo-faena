import { describe, expect, it } from 'vitest';
import { severityTone, state, statusTone } from './tokens';

describe('paleta operacional', () => {
  it('asigna un tono propio a cada severidad', () => {
    expect(severityTone('LOW')).toBe('good');
    expect(severityTone('MEDIUM')).toBe('warning');
    // `HIGH` tiene su propio paso: antes compartía el rojo de `CRITICAL` en el
    // chip mientras el medidor lo pintaba azul.
    expect(severityTone('HIGH')).toBe('serious');
    expect(severityTone('CRITICAL')).toBe('critical');
  });

  it('reserva el rojo para la severidad crítica y deja OPEN neutro', () => {
    expect(statusTone('OPEN')).toBe('neutral');
    expect(statusTone('ACKNOWLEDGED')).toBe('warning');
    expect(statusTone('ASSIGNED')).toBe('warning');
    expect(statusTone('IN_PROGRESS')).toBe('info');
    expect(statusTone('RESOLVED')).toBe('good');
    expect(statusTone('CLOSED')).toBe('good');
  });

  it('degrada a neutro ante valores desconocidos', () => {
    expect(severityTone('DESCONOCIDA')).toBe('neutral');
    expect(statusTone('DESCONOCIDO')).toBe('neutral');
  });

  it('expone un paso de marca y uno de texto por tono', () => {
    for (const tone of Object.values(state)) {
      expect(tone.mark).toMatch(/^#[0-9a-f]{6}$/);
      expect(tone.text).toMatch(/^#[0-9a-f]{6}$/);
    }
  });
});
