import { Box, CircularProgress, Stack, Typography } from '@mui/material';

export function PageState({ title, text }: { title: string; text: string }) {
  return (
    <Box sx={{ minHeight: '50vh', display: 'grid', placeItems: 'center' }}>
      <Stack alignItems="center" spacing={1}>
        <CircularProgress size={28} />
        <Typography variant="h5" component="h1">
          {title}
        </Typography>
        <Typography color="text.secondary">{text}</Typography>
      </Stack>
    </Box>
  );
}
