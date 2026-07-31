CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE TYPE "Role" AS ENUM ('SUPERVISOR', 'ADMIN');
CREATE TYPE "IncidentStatus" AS ENUM ('OPEN', 'ACKNOWLEDGED', 'RESOLVED');
CREATE TYPE "WorkOrderStatus" AS ENUM ('OPEN', 'ASSIGNED', 'IN_PROGRESS', 'CLOSED');
CREATE TYPE "Priority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

CREATE TABLE "areas" ("id" UUID NOT NULL DEFAULT gen_random_uuid(), "code" VARCHAR(32) NOT NULL, "name" VARCHAR(120) NOT NULL, "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "areas_pkey" PRIMARY KEY ("id"));
CREATE UNIQUE INDEX "areas_code_key" ON "areas"("code");

CREATE TABLE "sensors" ("id" UUID NOT NULL DEFAULT gen_random_uuid(), "area_id" UUID NOT NULL, "code" VARCHAR(64) NOT NULL, "name" VARCHAR(120) NOT NULL, "unit" VARCHAR(16) NOT NULL, "min_value" DECIMAL(12,4) NOT NULL, "max_value" DECIMAL(12,4) NOT NULL, "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "sensors_pkey" PRIMARY KEY ("id"), CONSTRAINT "sensors_range_check" CHECK ("min_value" <= "max_value"));
CREATE UNIQUE INDEX "sensors_code_key" ON "sensors"("code");
CREATE INDEX "sensors_area_id_idx" ON "sensors"("area_id");

CREATE TABLE "readings" ("id" UUID NOT NULL DEFAULT gen_random_uuid(), "sensor_id" UUID NOT NULL, "value" DECIMAL(12,4) NOT NULL, "measured_at" TIMESTAMPTZ(6) NOT NULL, "received_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "readings_pkey" PRIMARY KEY ("id"));
CREATE INDEX "readings_sensor_id_measured_at_idx" ON "readings"("sensor_id", "measured_at" DESC);

CREATE TABLE "users" ("id" UUID NOT NULL DEFAULT gen_random_uuid(), "email" VARCHAR(320) NOT NULL, "name" VARCHAR(120) NOT NULL, "role" "Role" NOT NULL, "password_hash" VARCHAR(255) NOT NULL, "active" BOOLEAN NOT NULL DEFAULT true, "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "users_pkey" PRIMARY KEY ("id"));
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

CREATE TABLE "teams" ("id" UUID NOT NULL DEFAULT gen_random_uuid(), "code" VARCHAR(32) NOT NULL, "name" VARCHAR(120) NOT NULL, "active" BOOLEAN NOT NULL DEFAULT true, "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "teams_pkey" PRIMARY KEY ("id"));
CREATE UNIQUE INDEX "teams_code_key" ON "teams"("code");

CREATE TABLE "incidents" ("id" UUID NOT NULL DEFAULT gen_random_uuid(), "sensor_id" UUID NOT NULL, "trigger_reading_id" UUID NOT NULL, "status" "IncidentStatus" NOT NULL DEFAULT 'OPEN', "opened_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP, "acknowledged_at" TIMESTAMPTZ(6), "resolved_at" TIMESTAMPTZ(6), "acknowledged_by_id" UUID, "resolved_by_id" UUID, CONSTRAINT "incidents_pkey" PRIMARY KEY ("id"));
CREATE UNIQUE INDEX "incidents_trigger_reading_id_key" ON "incidents"("trigger_reading_id");
CREATE INDEX "incidents_sensor_id_status_idx" ON "incidents"("sensor_id", "status");
CREATE INDEX "incidents_acknowledged_by_id_idx" ON "incidents"("acknowledged_by_id");
CREATE INDEX "incidents_resolved_by_id_idx" ON "incidents"("resolved_by_id");
CREATE UNIQUE INDEX "incidents_one_active_per_sensor_idx" ON "incidents"("sensor_id") WHERE "status" IN ('OPEN', 'ACKNOWLEDGED');

CREATE TABLE "work_orders" ("id" UUID NOT NULL DEFAULT gen_random_uuid(), "title" VARCHAR(160) NOT NULL, "description" VARCHAR(4000), "priority" "Priority" NOT NULL DEFAULT 'MEDIUM', "status" "WorkOrderStatus" NOT NULL DEFAULT 'OPEN', "incident_id" UUID, "team_id" UUID, "created_by_id" UUID NOT NULL, "assigned_by_id" UUID, "started_by_id" UUID, "closed_by_id" UUID, "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP, "assigned_at" TIMESTAMPTZ(6), "started_at" TIMESTAMPTZ(6), "closed_at" TIMESTAMPTZ(6), "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "work_orders_pkey" PRIMARY KEY ("id"), CONSTRAINT "work_orders_assignment_check" CHECK ("status" = 'OPEN' OR "team_id" IS NOT NULL), CONSTRAINT "work_orders_closed_check" CHECK ("status" <> 'CLOSED' OR "closed_at" IS NOT NULL));
CREATE INDEX "work_orders_incident_id_idx" ON "work_orders"("incident_id");
CREATE INDEX "work_orders_team_id_status_idx" ON "work_orders"("team_id", "status");
CREATE INDEX "work_orders_created_by_id_idx" ON "work_orders"("created_by_id");

ALTER TABLE "sensors" ADD CONSTRAINT "sensors_area_id_fkey" FOREIGN KEY ("area_id") REFERENCES "areas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "readings" ADD CONSTRAINT "readings_sensor_id_fkey" FOREIGN KEY ("sensor_id") REFERENCES "sensors"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "incidents" ADD CONSTRAINT "incidents_sensor_id_fkey" FOREIGN KEY ("sensor_id") REFERENCES "sensors"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "incidents" ADD CONSTRAINT "incidents_trigger_reading_id_fkey" FOREIGN KEY ("trigger_reading_id") REFERENCES "readings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "incidents" ADD CONSTRAINT "incidents_acknowledged_by_id_fkey" FOREIGN KEY ("acknowledged_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "incidents" ADD CONSTRAINT "incidents_resolved_by_id_fkey" FOREIGN KEY ("resolved_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_incident_id_fkey" FOREIGN KEY ("incident_id") REFERENCES "incidents"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_assigned_by_id_fkey" FOREIGN KEY ("assigned_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_started_by_id_fkey" FOREIGN KEY ("started_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_closed_by_id_fkey" FOREIGN KEY ("closed_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
