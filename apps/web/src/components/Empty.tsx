import { Paper, Typography } from '@mui/material';
import { esCL } from '@faena/contracts';

export function Empty({ text }: { text: string }) {
  return (
    <Paper sx={{ p: 5, textAlign: 'center' }}>
      <Typography color="text.secondary">{esCL.state.noResults}</Typography>
      <Typography sx={{ mt: 1 }}>{text}</Typography>
    </Paper>
  );
}
