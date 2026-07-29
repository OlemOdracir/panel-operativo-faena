import { Stack, Typography } from '@mui/material';

export function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <Stack
      direction="row"
      justifyContent="space-between"
      sx={{ py: 1, borderBottom: 1, borderColor: 'divider' }}
    >
      <Typography color="text.secondary">{label}</Typography>
      <Typography fontWeight={600}>{value}</Typography>
    </Stack>
  );
}
