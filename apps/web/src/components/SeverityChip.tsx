import { Chip } from '@mui/material';
import { labelSeverity } from '@faena/contracts';
import { chipColorForTone } from '../app/theme';
import { severityTone } from '../app/tokens';

export function SeverityChip({ severity }: { severity: string }) {
  return (
    <Chip
      size="small"
      label={labelSeverity(severity)}
      color={chipColorForTone[severityTone(severity)]}
    />
  );
}
