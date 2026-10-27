-- Review and apply to the intended database before enabling the feature.
CREATE TABLE "ProcurementSupplier" ("id" TEXT PRIMARY KEY, "companyId" TEXT NOT NULL REFERENCES "Company"("id") ON DELETE CASCADE, "name" TEXT NOT NULL, "contactName" TEXT NOT NULL DEFAULT '', "email" TEXT NOT NULL, "archived" BOOLEAN NOT NULL DEFAULT false, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL);
CREATE INDEX "ProcurementSupplier_companyId_archived_idx" ON "ProcurementSupplier"("companyId", "archived");
CREATE TABLE "MaterialRfq" ("id" TEXT PRIMARY KEY, "companyId" TEXT NOT NULL REFERENCES "Company"("id") ON DELETE CASCADE, "title" TEXT NOT NULL DEFAULT '', "data" JSONB NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL);
CREATE INDEX "MaterialRfq_companyId_updatedAt_idx" ON "MaterialRfq"("companyId", "updatedAt");
