import { Box, Stack, Tooltip, Typography } from '@mui/material';
import { esCL, formatMeasurement } from '@faena/contracts';
import { severityTone, state } from '../app/tokens';
import { IconOverMax, IconUnderMin } from '../app/icons';

/**
 * La medición es el dato que originó el incidente, así que es lo que manda en
 * la fila: cifra grande con su unidad, cuánto se salió del rango y un medidor
 * que muestra el desborde. El resto de las columnas queda como contexto.
 *
 * El medidor dibuja el rango válido como pista neutra y el exceso en el color
 * de la severidad, con una separación de 2px entre ambos para que se lean como
 * tramos distintos y no como una sola barra.
 */
export function ReadingCell({
  value,
  unit,
  minValue,
  maxValue,
  severity,
}: {
  value: number;
  unit: string;
  minValue: number;
  maxValue: number;
  severity: string;
}) {
  const tone = state[severityTone(severity)];
  const span = Math.max(maxValue - minValue, Number.EPSILON);
  const overMax = Math.max(0, value - maxValue);
  const underMin = Math.max(0, minValue - value);
  const total = span + overMax + underMin;
  const pct = (part: number) => `${(part / total) * 100}%`;

  const deviation = overMax > 0 ? overMax : underMin;
  const direction = overMax > 0 ? esCL.reading.over : underMin > 0 ? esCL.reading.under : null;
  const DirectionIcon = overMax > 0 ? IconOverMax : IconUnderMin;

  return (
    <Stack spacing={0.75} sx={{ py: 0.5, minWidth: 168 }}>
      <Stack direction="row" alignItems="baseline" spacing={1}>
        <Typography
          sx={{
            fontSize: '1.375rem',
            fontWeight: 680,
            lineHeight: 1.1,
            letterSpacing: '-0.02em',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {formatMeasurement(value, unit)}
        </Typography>
        {direction ? (
          <Tooltip title={`${formatMeasurement(deviation, unit)} ${direction}`}>
            <Stack
              direction="row"
              alignItems="center"
              spacing={0.25}
              sx={{ color: tone.text, flexShrink: 0 }}
            >
              <DirectionIcon sx={{ fontSize: '0.875rem' }} />
              <Typography
                variant="body2"
                sx={{ fontWeight: 650, fontVariantNumeric: 'tabular-nums' }}
              >
                {formatMeasurement(deviation, unit)}
              </Typography>
            </Stack>
          </Tooltip>
        ) : (
          <Typography variant="body2" color="text.secondary">
            {esCL.reading.withinRange}
          </Typography>
        )}
      </Stack>

      <Box sx={{ display: 'flex', gap: '2px', height: 6, alignItems: 'stretch' }}>
        {underMin > 0 && (
          <Box sx={{ width: pct(underMin), bgcolor: tone.mark, borderRadius: '3px 0 0 3px' }} />
        )}
        <Box
          sx={{
            width: pct(span),
            bgcolor: 'action.hover',
            borderRadius: underMin > 0 ? (overMax > 0 ? 0 : '0 3px 3px 0') : '3px 0 0 3px',
          }}
        />
        {overMax > 0 && (
          <Box sx={{ width: pct(overMax), bgcolor: tone.mark, borderRadius: '0 3px 3px 0' }} />
        )}
      </Box>

      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ fontVariantNumeric: 'tabular-nums' }}
      >
        {esCL.reading.rangeLabel} {formatMeasurement(minValue)} –{' '}
        {formatMeasurement(maxValue, unit)}
      </Typography>
    </Stack>
  );
}
