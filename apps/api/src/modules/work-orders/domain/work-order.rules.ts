import { canTransitionWorkOrder, type WorkOrderStatus } from '@faena/contracts';

export function canAssignWorkOrder(status: WorkOrderStatus): boolean {
  return status === 'OPEN';
}

export function canAdvanceWorkOrder(current: WorkOrderStatus, next: WorkOrderStatus): boolean {
  return next !== 'ASSIGNED' && canTransitionWorkOrder(current, next);
}
