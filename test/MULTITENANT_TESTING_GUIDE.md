# 🏢 PawDex Multi-Tenant Testing Guide

## 📋 Overview

This guide provides comprehensive testing strategies for PawDex's multi-tenant architecture. It ensures tenant isolation, data security, and proper functionality across different tenant contexts.

## 🎯 Testing Objectives

- ✅ **Tenant Isolation**: Verify users can only access their tenant's data
- ✅ **Cross-Tenant Prevention**: Ensure no data leakage between tenants
- ✅ **Authentication Context**: Validate JWT tokens contain correct tenant information
- ✅ **Database Integrity**: Confirm all records have proper `tenantId` associations
- ✅ **Performance**: Ensure multi-tenancy doesn't degrade system performance
- ✅ **Cascade Operations**: Verify tenant deletion properly cascades to all related data

---

## 🧪 Testing Levels

### 1. **Unit Tests** 
*Test individual service methods for tenant isolation*

**Location**: `src/**/*.spec.ts`

**Key Areas**:
- Service methods include `tenantId` in database queries
- Controllers extract tenant from JWT token
- DTOs validate tenant-specific data

**Example Test Pattern**:
```typescript
describe('AppointmentsService - Tenant Isolation', () => {
  it('should only return appointments for the specified tenant', async () => {
    // Arrange
    const tenantId = 'tenant-1';
    
    // Act
    await service.findAll(tenantId);
    
    // Assert
    expect(mockPrismaService.appointment.findMany).toHaveBeenCalledWith({
      where: { tenantId },
      // ... other conditions
    });
  });
});
```

### 2. **Integration Tests**
*Test complete workflows across multiple components*

**Location**: `test/multitenant-integration.spec.ts`

**Key Scenarios**:
- End-to-end patient creation and retrieval
- Cross-tenant access prevention
- Tenant data cascade deletion
- Authentication flow with tenant context

### 3. **Database Tests**
*Verify data integrity and isolation at the database level*

**Location**: `test/multitenant-db-tests.sql`

**Key Checks**:
- All records have `tenantId`
- No cross-tenant foreign key violations
- Proper cascade delete behavior
- Index performance for tenant queries

### 4. **API Tests**
*Test REST endpoints with different tenant contexts*

**Location**: `test/PawDex_MultiTenant_API_Tests.postman_collection.json`

**Key Scenarios**:
- Login with different tenant users
- CRUD operations with tenant isolation
- Cross-tenant access attempts (should fail)
- Bulk operations within tenant scope

### 5. **Load Tests**
*Verify tenant isolation under concurrent load*

**Location**: `test/multitenant-load-test.js`

**Key Metrics**:
- Response time consistency across tenants
- No tenant isolation violations under load
- Error rate within acceptable limits
- Memory and CPU usage patterns

---

## 🚀 Quick Start Testing

### Prerequisites
```bash
# Install dependencies
npm install

# Set up test database
npm run db:test:setup

# Create test tenants and users
npm run seed:test
```

### Run All Tests
```bash
# Unit tests
npm run test

# Integration tests  
npm run test:integration

# Load tests
node test/multitenant-load-test.js

# Database tests (run in database client)
# Execute queries from test/multitenant-db-tests.sql
```

---

## 📊 Testing Checklist

### ✅ **Pre-Testing Setup**
- [ ] Test database is isolated from production
- [ ] Test tenants are created (`test-tenant-1`, `test-tenant-2`)
- [ ] Test users exist for each tenant with different roles
- [ ] Sample data is seeded for realistic testing
- [ ] Environment variables are set for testing

### ✅ **Unit Test Coverage**
- [ ] All service methods include `tenantId` parameter
- [ ] Controllers extract tenant from JWT token
- [ ] Database queries filter by `tenantId`
- [ ] Error handling for invalid tenant access
- [ ] DTO validation includes tenant context

### ✅ **Integration Test Scenarios**
- [ ] User login returns correct tenant context
- [ ] Patient CRUD operations respect tenant boundaries
- [ ] Appointment CRUD operations respect tenant boundaries
- [ ] Cross-tenant access returns 404/403 errors
- [ ] Tenant deletion cascades to all related data
- [ ] Bulk operations stay within tenant scope

### ✅ **Database Integrity**
- [ ] All tables have `tenantId` foreign key constraints
- [ ] No orphaned records without `tenantId`
- [ ] No cross-tenant foreign key violations
- [ ] Indexes exist on `tenantId` columns for performance
- [ ] Cascade delete rules are properly configured

### ✅ **API Security**
- [ ] JWT tokens contain tenant information
- [ ] Middleware extracts tenant from token
- [ ] All endpoints require authentication
- [ ] Cross-tenant requests are blocked
- [ ] Rate limiting is per-tenant

### ✅ **Performance Validation**
- [ ] Tenant queries use indexes efficiently
- [ ] Response times are consistent across tenants
- [ ] Memory usage doesn't grow with tenant count
- [ ] Concurrent tenant operations don't interfere
- [ ] Database connection pooling works correctly

### ✅ **Error Handling**
- [ ] Invalid tenant IDs return appropriate errors
- [ ] Missing tenant context is handled gracefully
- [ ] Cross-tenant access attempts are logged
- [ ] Database constraint violations are caught
- [ ] User-friendly error messages are returned

---

## 🔧 Test Data Management

### **Test Tenants**
```typescript
const TEST_TENANTS = [
  {
    id: 'test-tenant-1',
    name: 'Test Clinic A',
    subdomain: 'test-a',
    email: 'admin@test-a.com'
  },
  {
    id: 'test-tenant-2', 
    name: 'Test Clinic B',
    subdomain: 'test-b',
    email: 'admin@test-b.com'
  }
];
```

### **Test Users Per Tenant**
```typescript
const TEST_USERS = {
  'test-tenant-1': [
    { email: 'vet1@test-a.com', role: 'veterinarian' },
    { email: 'owner1@test-a.com', role: 'owner' },
    { email: 'admin1@test-a.com', role: 'admin' }
  ],
  'test-tenant-2': [
    { email: 'vet1@test-b.com', role: 'veterinarian' },
    { email: 'owner1@test-b.com', role: 'owner' },
    { email: 'admin1@test-b.com', role: 'admin' }
  ]
};
```

### **Cleanup Strategy**
```typescript
// After each test
await cleanupTestData(tenantId);

// After test suite
await resetTestDatabase();
```

---

## 🚨 Common Testing Pitfalls

### ❌ **What NOT to Do**
- Don't test with production data
- Don't skip cross-tenant access tests
- Don't ignore database constraint violations
- Don't test with only one tenant
- Don't forget to test cascade deletes
- Don't skip performance testing under load

### ✅ **Best Practices**
- Always test with multiple tenants
- Use realistic test data volumes
- Test both positive and negative scenarios
- Verify database state after operations
- Test with different user roles per tenant
- Monitor for tenant isolation violations

---

## 📈 Monitoring & Metrics

### **Key Metrics to Track**
- **Tenant Isolation Violations**: Should be 0
- **Cross-Tenant Access Attempts**: Should be blocked
- **Response Time by Tenant**: Should be consistent
- **Database Query Performance**: Should use indexes
- **Error Rate by Tenant**: Should be low and consistent

### **Alerting Thresholds**
- Tenant isolation violation: Immediate alert
- Cross-tenant access success: Critical alert
- Response time > 2x normal: Warning
- Error rate > 5%: Warning
- Database query without tenant filter: Critical

---

## 🔍 Debugging Multi-Tenant Issues

### **Common Issues & Solutions**

1. **Cross-Tenant Data Leakage**
   ```sql
   -- Check for violations
   SELECT * FROM appointments a 
   JOIN patients p ON a.patientId = p.id 
   WHERE a.tenantId != p.tenantId;
   ```

2. **Missing Tenant Context**
   ```typescript
   // Add logging to track tenant extraction
   console.log('Extracted tenant:', req.user?.tenantId);
   ```

3. **Performance Issues**
   ```sql
   -- Check if indexes are being used
   EXPLAIN ANALYZE SELECT * FROM patients WHERE tenantId = 'tenant-1';
   ```

4. **Authentication Problems**
   ```typescript
   // Verify JWT token contains tenant
   const decoded = jwt.verify(token, secret);
   console.log('Token tenant:', decoded.tenantId);
   ```

---

## 📚 Additional Resources

- **Database Schema**: `prisma/schema-multitenant.prisma`
- **Migration Scripts**: `prisma/migrations/add-multitenancy.sql`
- **Middleware**: `src/common/middleware/tenant-context.middleware.ts`
- **Service Examples**: `src/appointments/appointments.service.ts`
- **Test Examples**: `src/appointments/appointments.service.spec.ts`

---

## 🎯 Success Criteria

A successful multi-tenant implementation should achieve:

- ✅ **100% Tenant Isolation** - No cross-tenant data access
- ✅ **Zero Data Leakage** - All queries filtered by tenant
- ✅ **Consistent Performance** - Response times similar across tenants
- ✅ **Proper Error Handling** - Clear messages for tenant-related errors
- ✅ **Complete Test Coverage** - All tenant scenarios tested
- ✅ **Database Integrity** - All constraints and indexes in place

---

*Last Updated: 2025-01-04*
*Version: 1.0*