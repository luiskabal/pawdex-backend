-- ============================================================================
-- MULTITENANT DATABASE TESTING SCRIPTS
-- ============================================================================
-- These scripts help verify tenant isolation at the database level

-- ============================================================================
-- 1. TENANT ISOLATION VERIFICATION
-- ============================================================================

-- Verify all records have tenantId
SELECT 
  'users' as table_name,
  COUNT(*) as total_records,
  COUNT("tenantId") as records_with_tenant,
  COUNT(*) - COUNT("tenantId") as records_without_tenant
FROM "users"
UNION ALL
SELECT 
  'patients' as table_name,
  COUNT(*) as total_records,
  COUNT("tenantId") as records_with_tenant,
  COUNT(*) - COUNT("tenantId") as records_without_tenant
FROM "patients"
UNION ALL
SELECT 
  'appointments' as table_name,
  COUNT(*) as total_records,
  COUNT("tenantId") as records_with_tenant,
  COUNT(*) - COUNT("tenantId") as records_without_tenant
FROM "appointments";

-- ============================================================================
-- 2. CROSS-TENANT DATA LEAKAGE TESTS
-- ============================================================================

-- Test: Verify no appointments reference patients from different tenants
SELECT 
  a.id as appointment_id,
  a."tenantId" as appointment_tenant,
  p."tenantId" as patient_tenant,
  'CROSS_TENANT_LEAK' as issue_type
FROM "appointments" a
JOIN "patients" p ON a."patientId" = p.id
WHERE a."tenantId" != p."tenantId";

-- Test: Verify no appointments reference vets from different tenants  
SELECT 
  a.id as appointment_id,
  a."tenantId" as appointment_tenant,
  u."tenantId" as vet_tenant,
  'CROSS_TENANT_VET_LEAK' as issue_type
FROM "appointments" a
JOIN "users" u ON a."vetId" = u.id
WHERE a."tenantId" != u."tenantId";

-- Test: Verify no patients reference owners from different tenants
SELECT 
  p.id as patient_id,
  p."tenantId" as patient_tenant,
  u."tenantId" as owner_tenant,
  'CROSS_TENANT_OWNER_LEAK' as issue_type
FROM "patients" p
JOIN "users" u ON p."ownerId" = u.id
WHERE p."tenantId" != u."tenantId";

-- ============================================================================
-- 3. TENANT DATA DISTRIBUTION
-- ============================================================================

-- Show data distribution across tenants
SELECT 
  t.name as tenant_name,
  t.id as tenant_id,
  COUNT(DISTINCT u.id) as user_count,
  COUNT(DISTINCT p.id) as patient_count,
  COUNT(DISTINCT a.id) as appointment_count
FROM "tenants" t
LEFT JOIN "users" u ON t.id = u."tenantId"
LEFT JOIN "patients" p ON t.id = p."tenantId"
LEFT JOIN "appointments" a ON t.id = a."tenantId"
GROUP BY t.id, t.name
ORDER BY t.name;

-- ============================================================================
-- 4. REFERENTIAL INTEGRITY TESTS
-- ============================================================================

-- Test: Find orphaned appointments (patient doesn't exist)
SELECT 
  a.id as appointment_id,
  a."patientId",
  'ORPHANED_APPOINTMENT_PATIENT' as issue_type
FROM "appointments" a
LEFT JOIN "patients" p ON a."patientId" = p.id AND a."tenantId" = p."tenantId"
WHERE p.id IS NULL;

-- Test: Find orphaned appointments (vet doesn't exist)
SELECT 
  a.id as appointment_id,
  a."vetId",
  'ORPHANED_APPOINTMENT_VET' as issue_type
FROM "appointments" a
LEFT JOIN "users" u ON a."vetId" = u.id AND a."tenantId" = u."tenantId"
WHERE u.id IS NULL;

-- Test: Find orphaned patients (owner doesn't exist)
SELECT 
  p.id as patient_id,
  p."ownerId",
  'ORPHANED_PATIENT_OWNER' as issue_type
FROM "patients" p
LEFT JOIN "users" u ON p."ownerId" = u.id AND p."tenantId" = u."tenantId"
WHERE u.id IS NULL;

-- ============================================================================
-- 5. PERFORMANCE TESTS
-- ============================================================================

-- Test: Verify indexes are being used for tenant queries
EXPLAIN (ANALYZE, BUFFERS) 
SELECT * FROM "appointments" 
WHERE "tenantId" = 'test-tenant-1' 
ORDER BY date DESC 
LIMIT 10;

EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM "patients" 
WHERE "tenantId" = 'test-tenant-1' AND "isActive" = true;

EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM "users" 
WHERE "tenantId" = 'test-tenant-1' AND "isActive" = true;

-- ============================================================================
-- 6. CASCADE DELETE TESTS
-- ============================================================================

-- Before running these, create test data first!
-- WARNING: These are destructive tests - only run on test databases

-- Test cascade delete (create test tenant first)
/*
-- Create test tenant
INSERT INTO "tenants" ("id", "name", "subdomain", "slug", "email", "isActive", "createdAt", "updatedAt")
VALUES ('cascade-test-tenant', 'Cascade Test', 'cascade-test', 'cascade-test', 'test@cascade.com', true, NOW(), NOW());

-- Create test user
INSERT INTO "users" ("id", "tenantId", "email", "name", "password", "roleId", "isActive", "createdAt", "updatedAt")
VALUES ('cascade-test-user', 'cascade-test-tenant', 'test@cascade.com', 'Test User', 'hash', 'role-id', true, NOW(), NOW());

-- Create test patient
INSERT INTO "patients" ("id", "tenantId", "name", "speciesId", "gender", "birthDate", "ownerId", "isActive", "createdAt", "updatedAt")
VALUES ('cascade-test-patient', 'cascade-test-tenant', 'Test Pet', 'dog', 'male', '2020-01-01', 'cascade-test-user', true, NOW(), NOW());

-- Create test appointment
INSERT INTO "appointments" ("id", "tenantId", "patientId", "vetId", "statusId", "date", "duration", "reason", "createdAt", "updatedAt")
VALUES ('cascade-test-appointment', 'cascade-test-tenant', 'cascade-test-patient', 'cascade-test-user', 'scheduled', NOW() + INTERVAL '1 day', 30, 'test', NOW(), NOW());

-- Verify data exists
SELECT 'Before Delete' as status, COUNT(*) as count FROM "users" WHERE "tenantId" = 'cascade-test-tenant'
UNION ALL
SELECT 'Before Delete' as status, COUNT(*) as count FROM "patients" WHERE "tenantId" = 'cascade-test-tenant'
UNION ALL
SELECT 'Before Delete' as status, COUNT(*) as count FROM "appointments" WHERE "tenantId" = 'cascade-test-tenant';

-- Delete tenant (should cascade)
DELETE FROM "tenants" WHERE "id" = 'cascade-test-tenant';

-- Verify all data is deleted
SELECT 'After Delete' as status, COUNT(*) as count FROM "users" WHERE "tenantId" = 'cascade-test-tenant'
UNION ALL
SELECT 'After Delete' as status, COUNT(*) as count FROM "patients" WHERE "tenantId" = 'cascade-test-tenant'
UNION ALL
SELECT 'After Delete' as status, COUNT(*) as count FROM "appointments" WHERE "tenantId" = 'cascade-test-tenant';
*/

-- ============================================================================
-- 7. UNIQUE CONSTRAINT TESTS
-- ============================================================================

-- Test: Verify email uniqueness is per-tenant (should allow same email in different tenants)
SELECT 
  email,
  COUNT(*) as email_count,
  COUNT(DISTINCT "tenantId") as tenant_count,
  CASE 
    WHEN COUNT(*) > COUNT(DISTINCT "tenantId") THEN 'DUPLICATE_EMAIL_IN_TENANT'
    ELSE 'OK'
  END as status
FROM "users"
GROUP BY email
HAVING COUNT(*) > 1;

-- ============================================================================
-- 8. SAMPLE TEST DATA CREATION
-- ============================================================================

-- Create sample tenants for testing
/*
INSERT INTO "tenants" ("id", "name", "subdomain", "slug", "email", "isActive", "createdAt", "updatedAt")
VALUES 
  ('test-tenant-1', 'Test Clinic A', 'test-a', 'test-clinic-a', 'admin@test-a.com', true, NOW(), NOW()),
  ('test-tenant-2', 'Test Clinic B', 'test-b', 'test-clinic-b', 'admin@test-b.com', true, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Create sample users for each tenant
INSERT INTO "users" ("id", "tenantId", "email", "name", "password", "roleId", "isActive", "createdAt", "updatedAt")
VALUES 
  ('test-user-1a', 'test-tenant-1', 'vet1@test-a.com', 'Dr. Smith A', 'hash1', 'vet-role', true, NOW(), NOW()),
  ('test-user-1b', 'test-tenant-1', 'owner1@test-a.com', 'Owner A', 'hash2', 'owner-role', true, NOW(), NOW()),
  ('test-user-2a', 'test-tenant-2', 'vet1@test-b.com', 'Dr. Smith B', 'hash3', 'vet-role', true, NOW(), NOW()),
  ('test-user-2b', 'test-tenant-2', 'owner1@test-b.com', 'Owner B', 'hash4', 'owner-role', true, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Note: Same email addresses in different tenants should be allowed
INSERT INTO "users" ("id", "tenantId", "email", "name", "password", "roleId", "isActive", "createdAt", "updatedAt")
VALUES 
  ('test-user-same-email-1', 'test-tenant-1', 'same@email.com', 'User in Tenant 1', 'hash5', 'owner-role', true, NOW(), NOW()),
  ('test-user-same-email-2', 'test-tenant-2', 'same@email.com', 'User in Tenant 2', 'hash6', 'owner-role', true, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;
*/