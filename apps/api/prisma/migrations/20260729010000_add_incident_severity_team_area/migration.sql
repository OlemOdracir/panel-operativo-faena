CREATE TYPE "IncidentSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

ALTER TABLE "incidents" ADD COLUMN "severity" "IncidentSeverity" NOT NULL DEFAULT 'MEDIUM';

ALTER TABLE "teams" ADD COLUMN "area_id" UUID;
UPDATE "teams" SET "area_id" = (SELECT "id" FROM "areas" ORDER BY "code" LIMIT 1) WHERE "area_id" IS NULL;
ALTER TABLE "teams" ALTER COLUMN "area_id" SET NOT NULL;
CREATE INDEX "teams_area_id_idx" ON "teams"("area_id");
ALTER TABLE "teams" ADD CONSTRAINT "teams_area_id_fkey" FOREIGN KEY ("area_id") REFERENCES "areas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
