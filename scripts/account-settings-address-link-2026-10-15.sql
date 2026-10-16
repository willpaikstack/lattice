-- Additive only: preserves all current addresses. Linking is opt-in.
ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "billingSameAsShipping" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "AccountDefaults" ADD COLUMN IF NOT EXISTS "billingSameAsShipping" BOOLEAN NOT NULL DEFAULT false;
