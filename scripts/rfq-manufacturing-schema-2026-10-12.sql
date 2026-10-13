ALTER TABLE "Request" ADD COLUMN IF NOT EXISTS "intakeDeclaration" JSONB;
ALTER TABLE "RequestLineItem" ADD COLUMN IF NOT EXISTS "manufacturingDetails" JSONB;
