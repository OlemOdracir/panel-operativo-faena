import argon2 from 'argon2';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../dist/generated/prisma/client.js';
import { IncidentStatus, Role } from '../dist/generated/prisma/enums.js';
import { calculateIncidentSeverity } from '@faena/contracts';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error('DATABASE_URL is required for the seed');

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

const seedUsers = [
  {
    email: 'admin@faena.local',
    name: 'Administración Faena',
    role: Role.ADMIN,
    password: process.env.SEED_ADMIN_PASSWORD,
  },
  {
    email: 'supervisor@faena.local',
    name: 'Supervisión Turno A',
    role: Role.SUPERVISOR,
    password: process.env.SEED_SUPERVISOR_PASSWORD,
  },
] as const;

async function main(): Promise<void> {
  for (const user of seedUsers) {
    if (!user.password || user.password.length < 12) {
      throw new Error(`SEED password missing or too short for ${user.email}`);
    }
    await prisma.user.upsert({
      where: { email: user.email },
      update: {
        name: user.name,
        role: user.role,
        active: true,
        passwordHash: await argon2.hash(user.password, { type: argon2.argon2id }),
      },
      create: {
        email: user.email,
        name: user.name,
        role: user.role,
        passwordHash: await argon2.hash(user.password, { type: argon2.argon2id }),
      },
    });
  }

  const areas = await Promise.all([
    prisma.area.upsert({
      where: { code: 'MOLIENDA' },
      update: { name: 'Molienda' },
      create: { code: 'MOLIENDA', name: 'Molienda' },
    }),
    prisma.area.upsert({
      where: { code: 'CHANCADO' },
      update: { name: 'Chancado' },
      create: { code: 'CHANCADO', name: 'Chancado' },
    }),
    prisma.area.upsert({
      where: { code: 'TRANQUE' },
      update: { name: 'Tranque de relaves' },
      create: { code: 'TRANQUE', name: 'Tranque de relaves' },
    }),
  ]);

  const sensorDefinitions = [
    ['MOL-TEMP-01', 'Temperatura molino 1', '°C', 10, 80, areas[0].id],
    ['MOL-VIB-01', 'Vibración molino 1', 'mm/s', 0, 12, areas[0].id],
    ['CHA-PRES-01', 'Presión chancador primario', 'bar', 2, 10, areas[1].id],
    ['CHA-TEMP-01', 'Temperatura correa principal', '°C', 0, 65, areas[1].id],
    ['TRA-PH-01', 'pH tranque sector norte', 'pH', 6, 9, areas[2].id],
    ['TRA-NIV-01', 'Nivel tranque sector norte', 'm', 1, 14, areas[2].id],
  ] as const;

  const sensors = [];
  for (const [code, name, unit, minValue, maxValue, areaId] of sensorDefinitions) {
    sensors.push(
      await prisma.sensor.upsert({
        where: { code },
        update: { name, unit, minValue, maxValue, areaId },
        create: { code, name, unit, minValue, maxValue, areaId },
      }),
    );
  }

  await Promise.all([
    prisma.team.upsert({
      where: { code: 'MANT-MEC' },
      update: { name: 'Mantenimiento mecánico', active: true, areaId: areas[0].id },
      create: { code: 'MANT-MEC', name: 'Mantenimiento mecánico', areaId: areas[0].id },
    }),
    prisma.team.upsert({
      where: { code: 'MANT-ELEC' },
      update: { name: 'Mantenimiento eléctrico', active: true, areaId: areas[1].id },
      create: { code: 'MANT-ELEC', name: 'Mantenimiento eléctrico', areaId: areas[1].id },
    }),
  ]);

  const baseTime = Date.now() - 71 * 5 * 60_000;
  for (const [sensorIndex, sensor] of sensors.entries()) {
    for (let readingIndex = 0; readingIndex < 12; readingIndex += 1) {
      const id = deterministicUuid(`${sensor.code}-${readingIndex}`);
      const measuredAt = new Date(baseTime + (sensorIndex * 12 + readingIndex) * 5 * 60_000);
      const isOutlier = readingIndex === 10;
      const value = isOutlier
        ? Number(sensor.maxValue) + 5
        : Number(sensor.minValue) +
          (Number(sensor.maxValue) - Number(sensor.minValue)) * (0.25 + (readingIndex % 4) / 10);
      const reading = await prisma.reading.upsert({
        where: { id },
        update: { value, measuredAt, sensorId: sensor.id },
        create: { id, value, measuredAt, sensorId: sensor.id },
      });
      if (isOutlier) {
        const active = await prisma.incident.findFirst({
          where: {
            sensorId: sensor.id,
            status: { in: [IncidentStatus.OPEN, IncidentStatus.ACKNOWLEDGED] },
          },
        });
        if (!active)
          await prisma.incident.create({
            data: {
              sensorId: sensor.id,
              triggerReadingId: reading.id,
              severity: calculateIncidentSeverity(
                value,
                Number(sensor.minValue),
                Number(sensor.maxValue),
              ),
            },
          });
      }
    }
  }
}

function deterministicUuid(seed: string): string {
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1)
    hash = (hash * 31 + seed.charCodeAt(index)) | 0;
  const hex = Math.abs(hash).toString(16).padStart(8, '0');
  return `${hex}-0000-4000-8000-${hex}${hex.slice(0, 4)}`;
}

main().finally(() => prisma.$disconnect());
