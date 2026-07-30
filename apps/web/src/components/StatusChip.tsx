import { Chip } from '@mui/material';
import { labelStatus } from '@faena/contracts';
import { chipColorForTone } from '../app/theme';
import { statusTone } from '../app/tokens';

export function StatusChip({ status }: { status: string }) {
  return (
    <Chip size="small" label={labelStatus(status)} color={chipColorForTone[statusTone(status)]} />
  );
}
