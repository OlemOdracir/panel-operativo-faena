import { createTheme } from '@mui/material/styles';

export const faenaTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#21c2dd', contrastText: '#071014' },
    secondary: { main: '#6366f1' },
    background: { default: '#0d0f12', paper: '#15181e' },
    text: { primary: '#f4f6f8', secondary: '#9da7b3' },
    divider: '#2c333b',
    error: { main: '#f06a7c' },
    warning: { main: '#f2bd52' },
    success: { main: '#5ad39b' },
    info: { main: '#5cc8df' },
  },
  typography: {
    fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif',
    h1: { fontWeight: 650, letterSpacing: '-0.04em' },
    h2: { fontWeight: 650, letterSpacing: '-0.025em' },
    h3: { fontWeight: 650 },
    button: { textTransform: 'none', fontWeight: 600 },
  },
  shape: { borderRadius: 12 },
  spacing: 8,
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        '*': { boxSizing: 'border-box' },
        body: { margin: 0, minWidth: 320, minHeight: '100vh' },
        ':focus-visible': { outline: '2px solid #21c2dd', outlineOffset: 2 },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: 'none', border: '1px solid #2c333b' },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: { backgroundImage: 'none', border: '1px solid #2c333b' },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: { root: { minHeight: 40, borderRadius: 10 } },
    },
    MuiTextField: { defaultProps: { size: 'small', fullWidth: true } },
    MuiFormControl: { defaultProps: { size: 'small' } },
    MuiChip: { styleOverrides: { root: { fontWeight: 700, borderRadius: 8 } } },
    MuiTableCell: {
      styleOverrides: {
        root: { borderColor: '#2c333b' },
        head: {
          color: '#9da7b3',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
        },
      },
    },
  },
});
