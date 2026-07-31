import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { HealthService } from './health.service';

void describe('HealthService', () => {
  void it('returns an ISO timestamp and service metadata', () => {
    const status = new HealthService().getStatus();

    assert.deepEqual(
      {
        service: status.service,
        status: status.status,
        version: status.version,
      },
      {
        service: 'panel-operativo-faena-api',
        status: 'ok',
        version: '0.1.0',
      },
    );
    assert.equal(Number.isNaN(Date.parse(status.timestamp)), false);
  });
});
