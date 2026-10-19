-- Rename the per-part customer date preference inside ManufacturingDetails JSON.
-- Existing values are retained verbatim. An explicit new value (even blank) wins.
-- Idempotent; no columns, requests, files or historical date values are removed.
UPDATE "RequestLineItem"
SET "manufacturingDetails" =
  ("manufacturingDetails"::jsonb - 'targetShipDate') ||
  CASE WHEN "manufacturingDetails"::jsonb ? 'targetDeliveryDate' THEN '{}'::jsonb
       ELSE jsonb_build_object('targetDeliveryDate', "manufacturingDetails"::jsonb -> 'targetShipDate') END
WHERE jsonb_typeof("manufacturingDetails"::jsonb) = 'object'
  AND "manufacturingDetails"::jsonb ? 'targetShipDate';
