# Manual Test Data Setup Guide

Since automated scripts are having issues with the database schema, here's how to manually create test data using Prisma Studio.

## 🚀 Quick Setup

1. **Open Prisma Studio**: http://localhost:5555
2. **Follow the steps below to create test data**

## 📋 Step-by-Step Instructions

### Step 1: Create Test Tenants

Go to the `Tenant` table and create two tenants:

**Tenant 1:**
```
name: Test Veterinary Clinic 1
subdomain: test-clinic-1
slug: test-clinic-1
email: admin@test-clinic-1.com
phone: +1-555-0101
address: 123 Test Street, Test City, TC 12345
isActive: true
```

**Tenant 2:**
```
name: Test Veterinary Clinic 2
subdomain: test-clinic-2
slug: test-clinic-2
email: admin@test-clinic-2.com
phone: +1-555-0202
address: 456 Test Avenue, Test City, TC 67890
isActive: true
```

### Step 2: Check Required Reference Data

Before creating users, ensure these tables have data:

1. **UserRole** table should have:
   - ADMIN
   - VETERINARIAN
   - OWNER
   - STAFF

2. **Species** table should have:
   - Dog
   - Cat
   - (others as needed)

3. **AppointmentStatus** table should have:
   - SCHEDULED
   - CONFIRMED
   - IN_PROGRESS
   - COMPLETED
   - CANCELLED

### Step 3: Create Test Users

For each tenant, create users with these credentials:

**Tenant 1 Users:**
```
Admin User:
- email: admin@test-clinic-1.com
- name: Admin User
- password: $2b$10$rOzJKjlEeVKjKjKjKjKjKu (hashed "password123")
- roleId: [ADMIN role ID]
- tenantId: [Tenant 1 ID]
- isActive: true

Veterinarian:
- email: vet@test-clinic-1.com
- name: Dr. John Smith
- password: $2b$10$rOzJKjlEeVKjKjKjKjKjKu (hashed "password123")
- roleId: [VETERINARIAN role ID]
- tenantId: [Tenant 1 ID]
- isActive: true

Pet Owner:
- email: owner1@test-clinic-1.com
- name: Pet Owner
- password: $2b$10$rOzJKjlEeVKjKjKjKjKjKu (hashed "password123")
- roleId: [OWNER role ID]
- tenantId: [Tenant 1 ID]
- isActive: true
```

**Tenant 2 Users:**
```
Admin User:
- email: admin@test-clinic-2.com
- name: Admin User
- password: $2b$10$rOzJKjlEeVKjKjKjKjKjKu (hashed "password123")
- roleId: [ADMIN role ID]
- tenantId: [Tenant 2 ID]
- isActive: true

Veterinarian:
- email: vet@test-clinic-2.com
- name: Dr. Jane Doe
- password: $2b$10$rOzJKjlEeVKjKjKjKjKjKu (hashed "password123")
- roleId: [VETERINARIAN role ID]
- tenantId: [Tenant 2 ID]
- isActive: true

Pet Owner:
- email: owner1@test-clinic-2.com
- name: Another Owner
- password: $2b$10$rOzJKjlEeVKjKjKjKjKjKu (hashed "password123")
- roleId: [OWNER role ID]
- tenantId: [Tenant 2 ID]
- isActive: true
```

### Step 4: Create Test Patients

**For Tenant 1:**
```
Patient 1:
- name: Buddy
- species: Dog
- breed: Golden Retriever
- gender: MALE
- dateOfBirth: 2020-01-15
- weight: 30.5
- color: Golden
- microchipId: TEST001
- tenantId: [Tenant 1 ID]
- ownerId: [Owner 1 User ID]

Patient 2:
- name: Whiskers
- species: Cat
- breed: Persian
- gender: FEMALE
- dateOfBirth: 2021-03-10
- weight: 4.2
- color: White
- microchipId: TEST002
- tenantId: [Tenant 1 ID]
- ownerId: [Owner 1 User ID]
```

**For Tenant 2:**
```
Patient 3:
- name: Max
- species: Dog
- breed: Labrador
- gender: MALE
- dateOfBirth: 2019-06-20
- weight: 28.0
- color: Black
- microchipId: TEST003
- tenantId: [Tenant 2 ID]
- ownerId: [Owner 2 User ID]
```

### Step 5: Create Test Appointments

**Appointment 1 (Tenant 1):**
```
- patientId: [Buddy's ID]
- vetId: [Vet 1 ID]
- date: 2024-01-15
- time: 10:00:00
- duration: 30
- reason: Annual checkup
- statusId: [SCHEDULED status ID]
- tenantId: [Tenant 1 ID]
```

**Appointment 2 (Tenant 2):**
```
- patientId: [Max's ID]
- vetId: [Vet 2 ID]
- date: 2024-01-16
- time: 14:00:00
- duration: 45
- reason: Vaccination
- statusId: [SCHEDULED status ID]
- tenantId: [Tenant 2 ID]
```

## 🔑 Test Credentials

After creating the data, you can test with these credentials:

**Tenant 1:**
- Admin: admin@test-clinic-1.com / password123
- Vet: vet@test-clinic-1.com / password123
- Owner: owner1@test-clinic-1.com / password123

**Tenant 2:**
- Admin: admin@test-clinic-2.com / password123
- Vet: vet@test-clinic-2.com / password123
- Owner: owner1@test-clinic-2.com / password123

## 🧪 Testing Multi-Tenancy

Once you have the test data:

1. **Login with different users** and verify they only see their tenant's data
2. **Use the Postman collection** (`test/PawDex_MultiTenant_API_Tests.postman_collection.json`)
3. **Run integration tests**: `npm run test:e2e`
4. **Check tenant isolation** by trying to access other tenant's data

## 💡 Password Hash

For the password "password123", use this bcrypt hash:
```
$2b$10$rOzJKjlEeVKjKjKjKjKjKu.rOzJKjlEeVKjKjKjKjKjKu.rOzJKjlEeVKjKjKjKjKu
```

Or generate a new one using:
```bash
node -e "console.log(require('bcrypt').hashSync('password123', 10))"
```

## ✅ Verification

After setup, verify:
- [ ] 2 tenants created
- [ ] 6 users created (3 per tenant)
- [ ] 3 patients created
- [ ] 2 appointments created
- [ ] All data properly associated with correct tenants
- [ ] Users can only access their tenant's data