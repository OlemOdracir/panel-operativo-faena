import { canTransitionIncident, type IncidentStatus } from '@faena/contracts';

export function canAdvanceIncident(current: IncidentStatus, next: IncidentStatus): boolean {
  return canTransitionIncident(current, next);
}
