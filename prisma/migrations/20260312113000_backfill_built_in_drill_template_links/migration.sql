-- Backfill legacy session drills that were saved without templateId.
-- Only links to built-in templates using exact-normalized name match (trim + lowercase).
UPDATE "SessionDrill"
SET "templateId" = (
  SELECT MIN(dt."id")
  FROM "DrillTemplate" dt
  WHERE dt."isBuiltIn" = 1
    AND lower(trim(dt."name")) = lower(trim("SessionDrill"."drillName"))
)
WHERE "templateId" IS NULL
  AND EXISTS (
    SELECT 1
    FROM "DrillTemplate" dt
    WHERE dt."isBuiltIn" = 1
      AND lower(trim(dt."name")) = lower(trim("SessionDrill"."drillName"))
  );
