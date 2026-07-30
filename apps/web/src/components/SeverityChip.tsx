import { labelSeverity } from '@faena/contracts';
import { severityTone } from '../app/tokens';
import { StateChip } from './StateChip';

export function SeverityChip({ severity }: { severity: string }) {
  return <StateChip tone={severityTone(severity)} label={labelSeverity(severity)} />;
}
