-- Insert test data for multi-tenant testing
-- This script creates tenants, users, and basic test data

-- Create test tenants
INSERT INTO tenants (id, name, subdomain, slug, email, phone, address, "isActive", "createdAt", "updatedAt")
VALUES 
  ('test-tenant-1', 'Test Veterinary Clinic 1', 'test-clinic-1', 'test-clinic-1', 'admin@test-clinic-1.com', '+1-555-0101', '123 Test Street, Test City, TC 12345', true, NOW(), NOW()),
  ('test-tenant-2', 'Test Veterinary Clinic 2', 'test-clinic-2', 'test-clinic-2', 'admin@test-clinic-2.com', '+1-555-0202', '456 Test Avenue, Test City, TC 67890', true, NOW(), NOW())
ON CONFLICT (subdomain) DO NOTHING;

-- Get role IDs (assuming they exist)
-- We'll need to check what roles exist first

-- Check if we have basic roles
SELECT id, name FROM user_roles LIMIT 5;

-- Check if we have species
SELECT id, name FROM species LIMIT 5;

-- Check if we have appointment statuses
SELECT id, name FROM appointment_statuses LIMIT 5;

-- If the above queries show data, we can proceed with user creation
-- For now, let's just create the tenants and see what we have