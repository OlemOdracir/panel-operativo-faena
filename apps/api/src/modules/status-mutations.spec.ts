import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import request from 'supertest';
import { App } from 'supertest/types';
import { IncidentsController } from './incidents/incidents.controller';
import { IncidentsService } from './incidents/incidents.service';
import { WorkOrdersController } from './work-orders/work-orders.controller';
import { WorkOrdersService } from './work-orders/work-orders.service';

const id = '11111111-0000-4000-8000-000000000001';
const teamId = '22222222-0000-4000-8000-000000000002';

/**
 * Estas rutas combinan `@Param` con un esquema de cuerpo. Un `@UsePipes` a
 * nivel de método aplica el pipe a *todos* los argumentos, así que el esquema
 * del cuerpo también validaba los parámetros de ruta y devolvía 400 en cada
 * llamada. Las pruebas de servicio no lo veían porque los pipes viven en la
 * capa HTTP: hay que atravesarla.
 */
void describe('mutaciones de estado sobre la capa HTTP', () => {
  let app: INestApplication<App>;

  void before(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [IncidentsController, WorkOrdersController],
      providers: [
        {
          provide: IncidentsService,
          useValue: {
            changeStatus: (incidentId: string, status: string) => ({ id: incidentId, status }),
          },
        },
        {
          provide: WorkOrdersService,
          useValue: {
            changeStatus: (orderId: string, status: string) => ({ id: orderId, status }),
            assign: (orderId: string, team: string) => ({ id: orderId, teamId: team }),
          },
        },
      ],
      // `@CurrentUser()` resuelve a `undefined` porque no montamos el guard de
      // autenticación; los servicios simulados no lo usan.
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  void it('acepta el cambio de estado de un incidente', async () => {
    const response = await request(app.getHttpServer())
      .patch(`/incidents/${id}/status`)
      .send({ status: 'ACKNOWLEDGED' })
      .expect(200);

    assert.equal((response.body as { status: string }).status, 'ACKNOWLEDGED');
  });

  void it('acepta el cambio de estado de una orden', async () => {
    const response = await request(app.getHttpServer())
      .patch(`/work-orders/${id}/status`)
      .send({ status: 'IN_PROGRESS' })
      .expect(200);

    assert.equal((response.body as { status: string }).status, 'IN_PROGRESS');
  });

  void it('acepta la asignación de una orden', async () => {
    const response = await request(app.getHttpServer())
      .patch(`/work-orders/${id}/assignment`)
      .send({ teamId })
      .expect(200);

    assert.equal((response.body as { teamId: string }).teamId, teamId);
  });

  void it('sigue rechazando un cuerpo inválido y un identificador inválido', async () => {
    await request(app.getHttpServer())
      .patch(`/incidents/${id}/status`)
      .send({ status: 'INVENTADO' })
      .expect(400);

    await request(app.getHttpServer())
      .patch('/incidents/no-es-uuid/status')
      .send({ status: 'ACKNOWLEDGED' })
      .expect(400);
  });

  void after(async () => {
    await app.close();
  });
});
