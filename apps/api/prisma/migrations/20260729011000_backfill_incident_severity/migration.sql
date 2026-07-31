UPDATE "incidents" AS i
SET "severity" = CASE
  WHEN ABS(r."value" - CASE WHEN r."value" < s."min_value" THEN s."min_value" ELSE s."max_value" END) / GREATEST(s."max_value" - s."min_value", 0.0000001) > 0.3 THEN 'CRITICAL'::"IncidentSeverity"
  WHEN ABS(r."value" - CASE WHEN r."value" < s."min_value" THEN s."min_value" ELSE s."max_value" END) / GREATEST(s."max_value" - s."min_value", 0.0000001) > 0.15 THEN 'HIGH'::"IncidentSeverity"
  WHEN ABS(r."value" - CASE WHEN r."value" < s."min_value" THEN s."min_value" ELSE s."max_value" END) / GREATEST(s."max_value" - s."min_value", 0.0000001) > 0.05 THEN 'MEDIUM'::"IncidentSeverity"
  ELSE 'LOW'::"IncidentSeverity"
END
FROM "readings" AS r
, "sensors" AS s
WHERE r."id" = i."trigger_reading_id"
  AND s."id" = i."sensor_id";
