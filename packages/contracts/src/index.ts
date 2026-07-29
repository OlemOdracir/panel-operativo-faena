import { z } from 'zod';

export const roleSchema = z.enum(['SUPERVISOR', 'ADMIN']);
export const incidentStatusSchema = z.enum(['OPEN', 'ACKNOWLEDGED', 'RESOLVED']);
export const incidentSeveritySchema = z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']);
export const workOrderStatusSchema = z.enum(['OPEN', 'ASSIGNED', 'IN_PROGRESS', 'CLOSED']);
export const prioritySchema = z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']);

const uuidSchema = z.string().uuid();
const dateTimeSchema = z.string().datetime({ offset: true });

export const loginSchema = z.strictObject({
  email: z.string().trim().email().max(320),
  password: z.string().min(12).max(128),
});

export const readingSchema = z.strictObject({
  sensorId: uuidSchema,
  value: z.number().finite(),
  measuredAt: dateTimeSchema,
});

export const incidentStatusUpdateSchema = z.strictObject({ status: incidentStatusSchema });
export const workOrderCreateSchema = z.strictObject({
  title: z.string().trim().min(3).max(160),
  description: z.string().trim().max(4000).optional(),
  priority: prioritySchema.default('MEDIUM'),
  incidentId: uuidSchema.optional(),
});
export const workOrderAssignmentSchema = z.strictObject({ teamId: uuidSchema });
export const workOrderStatusUpdateSchema = z.strictObject({ status: workOrderStatusSchema });

export const paginationQuerySchema = z.strictObject({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  status: z.string().optional(),
  areaId: uuidSchema.optional(),
  sensorId: uuidSchema.optional(),
  teamId: uuidSchema.optional(),
});

export const incidentResponseSchema = z.strictObject({
  id: uuidSchema,
  status: incidentStatusSchema,
  severity: incidentSeveritySchema,
  sensorId: uuidSchema,
  sensorCode: z.string(),
  areaName: z.string(),
  value: z.number(),
  minValue: z.number(),
  maxValue: z.number(),
  openedAt: dateTimeSchema,
  acknowledgedAt: dateTimeSchema.nullable(),
  resolvedAt: dateTimeSchema.nullable(),
  acknowledgedBy: z.string().nullable(),
  resolvedBy: z.string().nullable(),
});

export const workOrderResponseSchema = z.strictObject({
  id: uuidSchema,
  title: z.string(),
  description: z.string().nullable(),
  priority: prioritySchema,
  status: workOrderStatusSchema,
  incidentId: uuidSchema.nullable(),
  teamId: uuidSchema.nullable(),
  teamName: z.string().nullable(),
  createdBy: z.string(),
  assignedAt: dateTimeSchema.nullable(),
  startedAt: dateTimeSchema.nullable(),
  closedAt: dateTimeSchema.nullable(),
  createdAt: dateTimeSchema,
});

export const userResponseSchema = z.strictObject({
  id: uuidSchema,
  email: z.string().email(),
  name: z.string(),
  role: roleSchema,
});

export const apiErrorSchema = z.strictObject({
  code: z.string(),
  message: z.string(),
  requestId: z.string(),
  details: z.unknown().optional(),
});

export type Role = z.infer<typeof roleSchema>;
export type IncidentStatus = z.infer<typeof incidentStatusSchema>;
export type IncidentSeverity = z.infer<typeof incidentSeveritySchema>;
export type WorkOrderStatus = z.infer<typeof workOrderStatusSchema>;
export type Priority = z.infer<typeof prioritySchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ReadingInput = z.infer<typeof readingSchema>;
export type IncidentResponse = z.infer<typeof incidentResponseSchema>;
export type WorkOrderResponse = z.infer<typeof workOrderResponseSchema>;
export type UserResponse = z.infer<typeof userResponseSchema>;

export function isOutOfRange(value: number, minValue: number, maxValue: number): boolean {
  return value < minValue || value > maxValue;
}

export function calculateIncidentSeverity(
  value: number,
  minValue: number,
  maxValue: number,
): IncidentSeverity {
  const range = Math.max(maxValue - minValue, Number.EPSILON);
  const deviation = value < minValue ? minValue - value : value > maxValue ? value - maxValue : 0;
  const ratio = deviation / range;
  if (ratio > 0.3) return 'CRITICAL';
  if (ratio > 0.15) return 'HIGH';
  if (ratio > 0.05) return 'MEDIUM';
  return 'LOW';
}

export function canTransitionIncident(from: IncidentStatus, to: IncidentStatus): boolean {
  return (
    (from === 'OPEN' && to === 'ACKNOWLEDGED') || (from === 'ACKNOWLEDGED' && to === 'RESOLVED')
  );
}

export function canTransitionWorkOrder(from: WorkOrderStatus, to: WorkOrderStatus): boolean {
  return (
    (from === 'OPEN' && to === 'ASSIGNED') ||
    (from === 'ASSIGNED' && to === 'IN_PROGRESS') ||
    (from === 'IN_PROGRESS' && to === 'CLOSED')
  );
}
