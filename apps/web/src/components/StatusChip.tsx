import { Chip } from '@mui/material';
import { labelStatus } from '@faena/contracts';

export function StatusChip({ status }: { status: string }) {
  return (
    <Chip
      size="small"
      label={labelStatus(status)}
      color={
        status === 'CLOSED' || status === 'RESOLVED'
          ? 'success'
          : status === 'IN_PROGRESS'
            ? 'info'
            : status === 'ACKNOWLEDGED' || status === 'ASSIGNED'
              ? 'warning'
              : 'error'
      }
    />
  );
}
