import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  canTransitionIncident,
  canTransitionWorkOrder,
  calculateIncidentSeverity,
  idParamsSchema,
  incidentListQuerySchema,
  incidentStatusUpdateSchema,
  isOutOfRange,
  workOrderCreateSchema,
  workOrderListQuerySchema,
} from '@faena/contracts';

void describe('operational domain rules', () => {
  void it('treats sensor boundaries as valid readings', () => {
    assert.equal(isOutOfRange(10, 10, 80), false);
    assert.equal(isOutOfRange(80, 10, 80), false);
    assert.equal(isOutOfRange(9.99, 10, 80), true);
    assert.equal(isOutOfRange(80.01, 10, 80), true);
  });

  void it('classifies incident severity from range deviation', () => {
    assert.equal(calculateIncidentSeverity(50, 10, 90), 'LOW');
    assert.equal(calculateIncidentSeverity(95, 10, 90), 'MEDIUM');
    assert.equal(calculateIncidentSeverity(110, 10, 90), 'HIGH');
    assert.equal(calculateIncidentSeverity(140, 10, 90), 'CRITICAL');
  });

  void it('only allows sequential incident transitions', () => {
    assert.equal(canTransitionIncident('OPEN', 'ACKNOWLEDGED'), true);
    assert.equal(canTransitionIncident('ACKNOWLEDGED', 'RESOLVED'), true);
    assert.equal(canTransitionIncident('OPEN', 'RESOLVED'), false);
    assert.equal(canTransitionIncident('RESOLVED', 'OPEN'), false);
  });

  void it('only allows sequential work-order transitions', () => {
    assert.equal(canTransitionWorkOrder('OPEN', 'ASSIGNED'), true);
    assert.equal(canTransitionWorkOrder('ASSIGNED', 'IN_PROGRESS'), true);
    assert.equal(canTransitionWorkOrder('IN_PROGRESS', 'CLOSED'), true);
    assert.equal(canTransitionWorkOrder('OPEN', 'CLOSED'), false);
    assert.equal(canTransitionWorkOrder('CLOSED', 'OPEN'), false);
  });

  void it('rejects unknown input fields before persistence', () => {
    const result = incidentStatusUpdateSchema.safeParse({ status: 'OPEN', userId: 'forbidden' });
    assert.equal(result.success, false);
  });

  void it('applies the default work-order priority', () => {
    const result = workOrderCreateSchema.parse({ title: 'Inspección de correa' });
    assert.equal(result.priority, 'MEDIUM');
  });

  void it('validates list filters and route identifiers at the API boundary', () => {
    assert.equal(incidentListQuerySchema.safeParse({ status: 'NOT_A_STATUS' }).success, false);
    assert.equal(
      workOrderListQuerySchema.safeParse({ status: 'OPEN,NOT_A_STATUS' }).success,
      false,
    );
    assert.deepEqual(workOrderListQuerySchema.parse({ status: 'OPEN,ASSIGNED' }).status, [
      'OPEN',
      'ASSIGNED',
    ]);
    assert.equal(idParamsSchema.safeParse({ id: 'not-a-uuid' }).success, false);
  });
});
