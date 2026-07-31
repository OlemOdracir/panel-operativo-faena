import { Chip } from '@mui/material';
import { chipColorForTone } from '../app/theme';
import type { StateTone } from '../app/tokens';
import {
  IconStateCritical,
  IconStateGood,
  IconStateInfo,
  IconStateNeutral,
  IconStateSerious,
  IconStateWarning,
} from '../app/icons';

const icons: Record<StateTone, typeof IconStateNeutral> = {
  neutral: IconStateNeutral,
  info: IconStateInfo,
  good: IconStateGood,
  warning: IconStateWarning,
  serious: IconStateSerious,
  critical: IconStateCritical,
};

/**
 * Chip de estado: forma, color y texto a la vez. El icono no es decorativo —
 * es el canal que sostiene la distinción cuando el color no basta.
 */
export function StateChip({ tone, label }: { tone: StateTone; label: string }) {
  const Icon = icons[tone];
  return (
    <Chip
      size="small"
      label={label}
      color={chipColorForTone[tone]}
      icon={<Icon sx={{ fontSize: '0.9375rem' }} />}
      sx={{ '& .MuiChip-icon': { color: 'inherit', marginLeft: '6px' } }}
    />
  );
}
