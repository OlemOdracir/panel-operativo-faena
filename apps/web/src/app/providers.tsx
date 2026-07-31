import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CssBaseline, ThemeProvider } from '@mui/material';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import 'dayjs/locale/es';
import { type PropsWithChildren, useState } from 'react';
import { faenaTheme } from './theme';

export function AppProviders({ children }: PropsWithChildren) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: 1,
            staleTime: 30_000,
          },
        },
      }),
  );

  return (
    <ThemeProvider theme={faenaTheme}>
      {/* Sin esto, todo el bloque `MuiCssBaseline` del tema es código muerto:
          el reset de `box-sizing`, el anillo de foco y el color de fondo. */}
      <CssBaseline />
      <LocalizationProvider
        dateAdapter={AdapterDayjs}
        adapterLocale="es"
        localeText={{ clearButtonLabel: 'Limpiar', todayButtonLabel: 'Hoy' }}
      >
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      </LocalizationProvider>
    </ThemeProvider>
  );
}
