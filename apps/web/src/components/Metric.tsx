import { Card, CardContent, Grid, Typography } from '@mui/material';

export function Metric({
  label,
  value,
  tone,
  hint,
}: {
  label: string;
  value: string | number;
  tone?: 'error' | 'primary';
  hint?: string;
}) {
  return (
    <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
      <Card sx={{ borderColor: tone ? `${tone}.main` : undefined }}>
        <CardContent>
          <Typography color="text.secondary">{label}</Typography>
          <Typography variant="h2" sx={{ mt: 1 }}>
            {value}
          </Typography>
          {hint && <Typography color="text.secondary">{hint}</Typography>}
        </CardContent>
      </Card>
    </Grid>
  );
}
