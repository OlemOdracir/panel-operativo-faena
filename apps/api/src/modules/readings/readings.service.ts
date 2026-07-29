import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { calculateIncidentSeverity, isOutOfRange, type ReadingInput } from '@faena/contracts';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class ReadingsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: ReadingInput): Promise<{
    id: string;
    sensorId: string;
    value: number;
    measuredAt: string;
    incidentId: string | null;
    incidentCreated: boolean;
  }> {
    return this.prisma
      .$transaction(async (tx) => {
        const sensor = await tx.sensor.findUnique({ where: { id: input.sensorId } });
        if (!sensor)
          throw new NotFoundException({ code: 'SENSOR_NOT_FOUND', message: 'Sensor not found' });
        const outOfRange = isOutOfRange(
          input.value,
          Number(sensor.minValue),
          Number(sensor.maxValue),
        );
        const reading = await tx.reading.create({
          data: { sensorId: sensor.id, value: input.value, measuredAt: new Date(input.measuredAt) },
        });
        let incidentCreated = false;
        if (outOfRange) {
          const inserted = await tx.$executeRaw`
          INSERT INTO incidents (sensor_id, trigger_reading_id, severity)
          VALUES (${sensor.id}::uuid, ${reading.id}::uuid, ${calculateIncidentSeverity(input.value, Number(sensor.minValue), Number(sensor.maxValue))}::"IncidentSeverity")
          ON CONFLICT DO NOTHING
        `;
          incidentCreated = inserted > 0;
        }
        const incident = await tx.incident.findFirst({
          where: { sensorId: sensor.id, status: { in: ['OPEN', 'ACKNOWLEDGED'] } },
          orderBy: { openedAt: 'desc' },
        });
        return {
          id: reading.id,
          sensorId: reading.sensorId,
          value: Number(reading.value),
          measuredAt: reading.measuredAt.toISOString(),
          incidentId: incident?.id ?? null,
          incidentCreated,
        };
      })
      .catch((error: unknown) => {
        if (error instanceof Error && error.message.includes('readings'))
          throw new ConflictException({
            code: 'READING_CONFLICT',
            message: 'Reading could not be stored',
          });
        throw error;
      });
  }
}
