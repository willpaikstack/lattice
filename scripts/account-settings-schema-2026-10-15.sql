-- Run once before releasing account settings. Repeat runs preserve all snapshots.
ALTER TABLE "Request" ADD COLUMN IF NOT EXISTS "billingSnapshot" JSONB;
-- Older RFQs did not store billing addresses. Freeze their current company billing
-- defaults before any new account edits. Historical values cannot be recovered.
UPDATE "Request" r
SET "billingSnapshot" = jsonb_build_object(
  'address', jsonb_build_object('address1', c."billingAddress1", 'address2', c."billingAddress2", 'city', c."billingCity", 'company', c."billingCompany", 'name', c."billingName", 'state', c."billingState", 'zipCode', c."billingZipCode"),
  'contact', jsonb_build_object('email', c."billingEmail", 'invoiceRoutingNotes', c."billingInvoiceRoutingNotes")
)
FROM "Company" c
WHERE r."buyerCompanyId" = c.id AND (r."billingSnapshot" IS NULL OR r."billingSnapshot" = 'null'::jsonb);
