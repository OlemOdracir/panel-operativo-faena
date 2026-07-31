/**
 * Única fuente de verdad de la paleta operacional.
 *
 * Los valores no son elegidos a ojo: los contrastes de superficies, tinta y
 * marca, y la escala de estado, se verificaron con el validador de paletas
 * contra las superficies oscuras reales de la aplicación. Ver
 * `docs/architecture.md` (sección «Paleta y tokens visuales») para los números.
 *
 * Nadie debe escribir un hex fuera de este archivo: el tema de MUI lo consume
 * y los componentes leen el tema.
 */

/** Planos de superficie, del más profundo al más elevado. */
export const surface = {
  canvas: '#0f1319',
  raised: '#161b23',
  overlay: '#1d2430',
  border: '#252d39',
  borderStrong: '#323b4a',
} as const;

/** Tinta. `muted` solo para texto auxiliar no esencial (>=3:1). */
export const ink = {
  primary: '#e6e9ee',
  secondary: '#98a2b3',
  muted: '#6b7686',
  /** Sobre un relleno de marca: 5.24:1 (el blanco solo alcanza 3.64:1). */
  onBrand: '#0b1017',
} as const;

/** Azul institucional. Reemplaza el cian neón anterior. */
export const brand = {
  light: '#6da7ec',
  main: '#3987e5',
  dark: '#256abf',
} as const;

/**
 * Escala de estado reservada. Nunca se usa para "una categoría más".
 *
 * - `mark`: rellenos, barras y puntos. Dentro de la banda de luminosidad
 *   oscura (L 0.48–0.67) y >=3:1 contra toda superficie.
 * - `text`: tinta de la etiqueta sobre el fondo tonal del chip, >=4.5:1
 *   (peor caso medido 4.94:1).
 * - `onMark`: tinta encima del relleno opaco (botón contenido). Casi siempre
 *   oscura, pero `critical` es la excepción medida: con tinta oscura queda en
 *   3.97:1 y con blanca alcanza 4.80:1. Asumir una sola tinta para todos los
 *   tonos deja ese botón bajo el umbral.
 *
 * La separación cromática de una progresión verde→ámbar→naranja→rojo no
 * alcanza el umbral para daltonismo — ninguna escala de severidad de cuatro
 * pasos lo hace, incluida la de referencia. Por eso el color aquí siempre
 * acompaña a una etiqueta de texto y nunca la sustituye.
 */
export const state = {
  neutral: { mark: '#7d8899', text: '#c3cbd6', onMark: ink.onBrand },
  info: { mark: brand.main, text: brand.light, onMark: ink.onBrand },
  good: { mark: '#199e70', text: '#3fbf7f', onMark: ink.onBrand },
  warning: { mark: '#c98500', text: '#e2a93f', onMark: ink.onBrand },
  serious: { mark: '#d95926', text: '#ef8f5c', onMark: ink.onBrand },
  critical: { mark: '#d03b3b', text: '#f0757e', onMark: '#ffffff' },
} as const;

export type StateTone = keyof typeof state;

/** Opacidades del chip tonal, validadas junto a los pasos `text`. */
export const tonal = { fill: 0.16, border: 0.32 } as const;

const severityTones: Record<string, StateTone> = {
  LOW: 'good',
  MEDIUM: 'warning',
  HIGH: 'serious',
  CRITICAL: 'critical',
};

const statusTones: Record<string, StateTone> = {
  OPEN: 'neutral',
  ACKNOWLEDGED: 'warning',
  ASSIGNED: 'warning',
  IN_PROGRESS: 'info',
  RESOLVED: 'good',
  CLOSED: 'good',
};

/**
 * Severidad → tono. Es la escala ordinal completa: `HIGH` tiene su propio
 * paso (`serious`) en lugar de compartir el rojo de `CRITICAL`.
 */
export function severityTone(severity: string): StateTone {
  return severityTones[severity] ?? 'neutral';
}

/**
 * Estado de flujo → tono. `OPEN` es neutro, no un error: el rojo queda
 * reservado a la severidad crítica para que signifique algo.
 */
export function statusTone(status: string): StateTone {
  return statusTones[status] ?? 'neutral';
}
