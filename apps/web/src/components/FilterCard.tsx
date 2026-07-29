import { Box, Button, Paper, Stack, Typography } from '@mui/material';
import ClearIcon from '@mui/icons-material/Clear';
import type { ReactNode } from 'react';

export function FilterCard({
  title,
  onClear,
  children,
}: {
  title: string;
  onClear: () => void;
  children: ReactNode;
}) {
  return (
    <Paper sx={{ p: 2 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="h6">{title}</Typography>
        <Button startIcon={<ClearIcon />} onClick={onClear}>
          Limpiar filtros
        </Button>
      </Stack>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)', xl: 'repeat(6, 1fr)' },
          gap: 1.5,
        }}
      >
        {children}
      </Box>
    </Paper>
  );
}
