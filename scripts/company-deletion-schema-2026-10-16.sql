-- Retain the historical buyer name when a company is permanently removed.
-- Additive only. Existing company links and records remain unchanged.
ALTER TABLE "Request" ADD COLUMN IF NOT EXISTS "buyerCompanyNameSnapshot" TEXT NOT NULL DEFAULT '';
