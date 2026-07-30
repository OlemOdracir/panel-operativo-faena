import { labelStatus } from '@faena/contracts';
import { statusTone } from '../app/tokens';
import { StateChip } from './StateChip';

export function StatusChip({ status }: { status: string }) {
  return <StateChip tone={statusTone(status)} label={labelStatus(status)} />;
}
