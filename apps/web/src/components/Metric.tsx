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
      {/* El acento va en un filo superior de 2px: rodear la tarjeta completa
          de color saturado convertía cada KPI en una alarma. */}
      {/* `height: 100%` empareja la altura con el resto de la fila: sin esto,
          el hint opcional (p. ej. «1 en progreso») hacía que esa tarjeta
          creciera sola y desalineaba la fila. */}
      <Card
        sx={{
          height: '100%',
          ...(tone && {
            borderTopWidth: 2,
            borderTopStyle: 'solid',
            borderTopColor: `${tone}.main`,
          }),
        }}
      >
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
