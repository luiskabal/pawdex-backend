-- ============================================================================
-- MULTI-TENANCY MIGRATION SCRIPT
-- This script safely adds multi-tenancy support to existing PawDex database
-- ============================================================================

-- Step 1: Create Tenants table
CREATE TABLE "tenants" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "subdomain" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "settings" JSONB NOT NULL DEFAULT '{}',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

-- Step 2: Add unique constraints for tenant table
CREATE UNIQUE INDEX "tenants_subdomain_key" ON "tenants"("subdomain");
CREATE UNIQUE INDEX "tenants_slug_key" ON "tenants"("slug");

-- Step 3: Create default tenant for existing data
INSERT INTO "tenants" ("id", "name", "subdomain", "slug", "email", "isActive", "createdAt", "updatedAt")
VALUES (
    'default-tenant-001',
    'Default Clinic',
    'default',
    'default-clinic',
    'admin@pawdex.com',
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

-- Step 4: Add tenantId columns to existing tables (nullable initially)
ALTER TABLE "users" ADD COLUMN "tenantId" TEXT;
ALTER TABLE "patients" ADD COLUMN "tenantId" TEXT;
ALTER TABLE "appointments" ADD COLUMN "tenantId" TEXT;

-- Step 5: Populate tenantId for existing records
UPDATE "users" SET "tenantId" = 'default-tenant-001' WHERE "tenantId" IS NULL;
UPDATE "patients" SET "tenantId" = 'default-tenant-001' WHERE "tenantId" IS NULL;
UPDATE "appointments" SET "tenantId" = 'default-tenant-001' WHERE "tenantId" IS NULL;

-- Step 6: Make tenantId columns NOT NULL
ALTER TABLE "users" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "patients" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "appointments" ALTER COLUMN "tenantId" SET NOT NULL;

-- Step 7: Add foreign key constraints
ALTER TABLE "users" ADD CONSTRAINT "users_tenantId_fkey" 
    FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "patients" ADD CONSTRAINT "patients_tenantId_fkey" 
    FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "appointments" ADD CONSTRAINT "appointments_tenantId_fkey" 
    FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Step 8: Add Patient-Owner relationship
ALTER TABLE "patients" ADD CONSTRAINT "patients_ownerId_fkey" 
    FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Step 9: Update unique constraints for tenant isolation
-- Drop existing unique constraint on users.email
ALTER TABLE "users" DROP CONSTRAINT "users_email_key";

-- Add new unique constraint for email per tenant
ALTER TABLE "users" ADD CONSTRAINT "users_tenantId_email_key" UNIQUE ("tenantId", "email");

-- Step 10: Create performance indexes
CREATE INDEX "users_tenantId_idx" ON "users"("tenantId");
CREATE INDEX "patients_tenantId_idx" ON "patients"("tenantId");
CREATE INDEX "patients_tenantId_ownerId_idx" ON "patients"("tenantId", "ownerId");
CREATE INDEX "appointments_tenantId_idx" ON "appointments"("tenantId");
CREATE INDEX "appointments_tenantId_date_idx" ON "appointments"("tenantId", "date");
CREATE INDEX "appointments_tenantId_vetId_idx" ON "appointments"("tenantId", "vetId");
CREATE INDEX "appointments_tenantId_patientId_idx" ON "appointments"("tenantId", "patientId");

-- Step 11: Create sample tenant for testing (optional)
INSERT INTO "tenants" ("id", "name", "subdomain", "slug", "email", "isActive", "createdAt", "updatedAt")
VALUES (
    'demo-clinic-001',
    'Demo Veterinary Clinic',
    'demo',
    'demo-clinic',
    'demo@pawdex.com',
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

-- ============================================================================
-- VERIFICATION QUERIES (Run these to verify migration success)
-- ============================================================================

-- Verify tenants table
-- SELECT * FROM "tenants";

-- Verify all users have tenantId
-- SELECT COUNT(*) as total_users, COUNT("tenantId") as users_with_tenant FROM "users";

-- Verify all patients have tenantId
-- SELECT COUNT(*) as total_patients, COUNT("tenantId") as patients_with_tenant FROM "patients";

-- Verify all appointments have tenantId
-- SELECT COUNT(*) as total_appointments, COUNT("tenantId") as appointments_with_tenant FROM "appointments";

-- Verify tenant isolation works
-- SELECT t.name as tenant_name, COUNT(u.id) as user_count 
-- FROM "tenants" t 
-- LEFT JOIN "users" u ON t.id = u."tenantId" 
-- GROUP BY t.id, t.name;

-- ============================================================================
-- ROLLBACK SCRIPT (Use only if needed to revert changes)
-- ============================================================================

/*
-- WARNING: This will remove all multi-tenancy features and data

-- Remove foreign key constraints
ALTER TABLE "users" DROP CONSTRAINT "users_tenantId_fkey";
ALTER TABLE "patients" DROP CONSTRAINT "patients_tenantId_fkey";
ALTER TABLE "appointments" DROP CONSTRAINT "appointments_tenantId_fkey";
ALTER TABLE "patients" DROP CONSTRAINT "patients_ownerId_fkey";

-- Remove tenant-specific unique constraint
ALTER TABLE "users" DROP CONSTRAINT "users_tenantId_email_key";

-- Restore original email unique constraint
ALTER TABLE "users" ADD CONSTRAINT "users_email_key" UNIQUE ("email");

-- Remove tenantId columns
ALTER TABLE "users" DROP COLUMN "tenantId";
ALTER TABLE "patients" DROP COLUMN "tenantId";
ALTER TABLE "appointments" DROP COLUMN "tenantId";

-- Drop indexes
DROP INDEX "users_tenantId_idx";
DROP INDEX "patients_tenantId_idx";
DROP INDEX "patients_tenantId_ownerId_idx";
DROP INDEX "appointments_tenantId_idx";
DROP INDEX "appointments_tenantId_date_idx";
DROP INDEX "appointments_tenantId_vetId_idx";
DROP INDEX "appointments_tenantId_patientId_idx";

-- Drop tenants table
DROP TABLE "tenants";
*/