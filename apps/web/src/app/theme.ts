import { alpha, createTheme } from '@mui/material/styles';
import { brand, ink, state, surface, tonal, type StateTone } from './tokens';

declare module '@mui/material/styles' {
  interface Palette {
    neutral: Palette['primary'];
    serious: Palette['primary'];
  }
  interface PaletteOptions {
    neutral?: PaletteOptions['primary'];
    serious?: PaletteOptions['primary'];
  }
}

declare module '@mui/material/Chip' {
  interface ChipPropsColorOverrides {
    neutral: true;
    serious: true;
  }
}

declare module '@mui/material/Button' {
  interface ButtonPropsColorOverrides {
    neutral: true;
    serious: true;
  }
}

/** `main` es el paso de marca; `light`, la tinta de etiqueta. */
const tone = (key: StateTone) => ({
  main: state[key].mark,
  light: state[key].text,
  dark: state[key].mark,
  contrastText: state[key].onMark,
});

/** Tono de la escala de estado → color de chip de MUI. */
export const chipColorForTone: Record<
  StateTone,
  'neutral' | 'info' | 'success' | 'warning' | 'serious' | 'error'
> = {
  neutral: 'neutral',
  info: 'info',
  good: 'success',
  warning: 'warning',
  serious: 'serious',
  critical: 'error',
};

/** Color de chip de MUI → tono de la escala de estado. */
const chipTones: ReadonlyArray<
  [
    'default' | 'primary' | 'info' | 'success' | 'warning' | 'error' | 'neutral' | 'serious',
    StateTone,
  ]
> = [
  ['default', 'neutral'],
  ['neutral', 'neutral'],
  ['primary', 'info'],
  ['info', 'info'],
  ['success', 'good'],
  ['warning', 'warning'],
  ['serious', 'serious'],
  ['error', 'critical'],
];

export const faenaTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: brand.main, light: brand.light, dark: brand.dark, contrastText: ink.onBrand },
    secondary: tone('neutral'),
    neutral: tone('neutral'),
    info: tone('info'),
    success: tone('good'),
    warning: tone('warning'),
    serious: tone('serious'),
    error: tone('critical'),
    background: { default: surface.canvas, paper: surface.raised },
    text: { primary: ink.primary, secondary: ink.secondary, disabled: ink.muted },
    divider: surface.border,
    action: {
      hover: alpha(ink.primary, 0.06),
      selected: alpha(brand.main, 0.14),
      disabled: ink.muted,
      disabledBackground: alpha(ink.primary, 0.08),
    },
  },
  typography: {
    fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif',
    // Escala contenida: los tamaños por defecto de MUI (h3 = 3rem) dominaban
    // la pantalla y hacían que el panel pareciera una landing, no un panel.
    h1: { fontSize: '2rem', fontWeight: 680, letterSpacing: '-0.02em', lineHeight: 1.15 },
    h2: { fontSize: '2rem', fontWeight: 660, letterSpacing: '-0.02em', lineHeight: 1.15 },
    h3: { fontSize: '1.625rem', fontWeight: 660, letterSpacing: '-0.015em', lineHeight: 1.2 },
    h4: { fontSize: '1.375rem', fontWeight: 650, letterSpacing: '-0.01em' },
    h5: { fontSize: '1.125rem', fontWeight: 640 },
    h6: { fontSize: '1rem', fontWeight: 640, letterSpacing: '0' },
    overline: {
      fontSize: '0.6875rem',
      fontWeight: 650,
      letterSpacing: '0.1em',
      lineHeight: 1.8,
    },
    body2: { fontSize: '0.875rem' },
    button: { textTransform: 'none', fontWeight: 600 },
  },
  shape: { borderRadius: 10 },
  spacing: 8,
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        // Reset canónico anclado en `html`. Requiere que `<CssBaseline />` esté
        // montado (ver `providers.tsx`): sin él este bloque no se emite y el
        // árbol queda en `content-box`, con lo que cualquier caja con
        // `width: 100%` más padding desborda el ancho de la ventana.
        html: { boxSizing: 'border-box', backgroundColor: surface.canvas },
        '*, *::before, *::after': { boxSizing: 'inherit' },
        body: { margin: 0, minWidth: 320, minHeight: '100vh' },
        ':focus-visible': { outline: `2px solid ${brand.main}`, outlineOffset: 2 },
      },
    },
    MuiPaper: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: { backgroundImage: 'none', border: `1px solid ${surface.border}` },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: { backgroundImage: 'none', border: `1px solid ${surface.border}` },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: { root: { minHeight: 40, borderRadius: 8 } },
    },
    MuiTextField: { defaultProps: { size: 'small', fullWidth: true } },
    MuiFormControl: { defaultProps: { size: 'small' } },
    MuiOutlinedInput: {
      styleOverrides: {
        notchedOutline: { borderColor: surface.borderStrong },
        root: {
          backgroundColor: alpha(surface.overlay, 0.5),
          '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: ink.muted },
        },
      },
    },
    MuiChip: {
      defaultProps: { size: 'small' },
      styleOverrides: {
        root: {
          fontWeight: 600,
          borderRadius: 6,
          border: '1px solid transparent',
        },
      },
      // Chips tonales: relleno translúcido + tinta y borde del mismo tono.
      // Sustituyen los rellenos saturados que competían entre sí en cada fila.
      variants: [
        ...chipTones.map(([color, key]) => ({
          props: { color, variant: 'filled' as const },
          style: {
            backgroundColor: alpha(state[key].mark, tonal.fill),
            borderColor: alpha(state[key].mark, tonal.border),
            color: state[key].text,
          },
        })),
        ...chipTones.map(([color, key]) => ({
          props: { color, variant: 'outlined' as const },
          style: {
            backgroundColor: 'transparent',
            borderColor: alpha(state[key].mark, tonal.border),
            color: state[key].text,
          },
        })),
      ],
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          '&.Mui-selected': {
            backgroundColor: alpha(brand.main, 0.14),
            '&:hover': { backgroundColor: alpha(brand.main, 0.2) },
          },
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: surface.overlay,
          border: `1px solid ${surface.borderStrong}`,
          color: ink.primary,
          fontSize: '0.75rem',
        },
        arrow: { color: surface.overlay },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: { borderColor: surface.border },
        head: {
          color: ink.muted,
          fontWeight: 650,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          fontSize: '0.6875rem',
        },
      },
    },
  },
});
