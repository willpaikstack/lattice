-- Additive only: historical addresses, request snapshots and account phones stay unchanged.
ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "shippingPhone" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "billingPhone" TEXT NOT NULL DEFAULT '';
ALTER TABLE "AccountDefaults" ADD COLUMN IF NOT EXISTS "shippingPhone" TEXT NOT NULL DEFAULT '';
ALTER TABLE "AccountDefaults" ADD COLUMN IF NOT EXISTS "billingPhone" TEXT NOT NULL DEFAULT '';
