import { Box, CircularProgress } from '@mui/material';

export function Loading() {
  return (
    <Box sx={{ display: 'grid', placeItems: 'center', py: 8 }}>
      <CircularProgress />
    </Box>
  );
}
