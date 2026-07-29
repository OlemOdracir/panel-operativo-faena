import { Chip } from '@mui/material';
import { labelSeverity } from '@faena/contracts';

export function SeverityChip({ severity }: { severity: string }) {
  return (
    <Chip
      size="small"
      label={labelSeverity(severity)}
      color={
        severity === 'CRITICAL' || severity === 'HIGH'
          ? 'error'
          : severity === 'MEDIUM'
            ? 'warning'
            : 'success'
      }
    />
  );
}
