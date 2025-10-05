/**
 * MULTITENANT TEST DATA SETUP SCRIPT
 * 
 * This script creates comprehensive test data for multi-tenant testing:
 * - Test tenants
 * - Test users with different roles
 * - Sample patients and appointments
 * - Required reference data (species, breeds, roles, etc.)
 */

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// Test data configuration
const TEST_CONFIG = {
  tenants: [
    {
      id: 'test-tenant-1',
      name: 'Test Veterinary Clinic A',
      subdomain: 'test-clinic-a',
      slug: 'test-clinic-a',
      email: 'admin@test-clinic-a.com',
      phone: '+1-555-0101',
      address: '123 Test Street, Test City, TC 12345'
    },
    {
      id: 'test-tenant-2', 
      name: 'Test Veterinary Clinic B',
      subdomain: 'test-clinic-b',
      slug: 'test-clinic-b',
      email: 'admin@test-clinic-b.com',
      phone: '+1-555-0102',
      address: '456 Test Avenue, Test City, TC 12346'
    }
  ],
  
  roles: [
    {
      id: 'admin',
      name: 'Administrator',
      description: 'Full system access'
    },
    {
      id: 'veterinarian',
      name: 'Veterinarian', 
      description: 'Medical professional with patient access'
    },
    {
      id: 'owner',
      name: 'Pet Owner',
      description: 'Pet owner with limited access'
    },
    {
      id: 'staff',
      name: 'Staff Member',
      description: 'Clinic staff with basic access'
    }
  ],

  species: [
    { id: 'dog', name: 'Dog' },
    { id: 'cat', name: 'Cat' },
    { id: 'bird', name: 'Bird' },
    { id: 'rabbit', name: 'Rabbit' }
  ],

  breeds: [
    { id: 'golden-retriever', name: 'Golden Retriever', speciesId: 'dog' },
    { id: 'labrador', name: 'Labrador', speciesId: 'dog' },
    { id: 'persian', name: 'Persian', speciesId: 'cat' },
    { id: 'siamese', name: 'Siamese', speciesId: 'cat' },
    { id: 'canary', name: 'Canary', speciesId: 'bird' },
    { id: 'holland-lop', name: 'Holland Lop', speciesId: 'rabbit' }
  ],

  appointmentStatuses: [
    { id: 'scheduled', name: 'Scheduled', description: 'Appointment is scheduled' },
    { id: 'in-progress', name: 'In Progress', description: 'Appointment is currently happening' },
    { id: 'completed', name: 'Completed', description: 'Appointment has been completed' },
    { id: 'cancelled', name: 'Cancelled', description: 'Appointment was cancelled' },
    { id: 'no-show', name: 'No Show', description: 'Patient did not show up' }
  ]
};

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

async function createReferenceData() {
  console.log('🔧 Creating reference data...');

  // Create roles
  for (const role of TEST_CONFIG.roles) {
    await prisma.userRole.upsert({
      where: { id: role.id },
      update: {},
      create: role
    });
  }

  // Create species
  for (const species of TEST_CONFIG.species) {
    await prisma.species.upsert({
      where: { id: species.id },
      update: {},
      create: species
    });
  }

  // Create breeds
  for (const breed of TEST_CONFIG.breeds) {
    await prisma.breed.upsert({
      where: { id: breed.id },
      update: {},
      create: breed
    });
  }

  // Create appointment statuses
  for (const status of TEST_CONFIG.appointmentStatuses) {
    await prisma.appointmentStatus.upsert({
      where: { id: status.id },
      update: {},
      create: status
    });
  }

  console.log('✅ Reference data created');
}

async function createTestTenants() {
  console.log('🏢 Creating test tenants...');

  for (const tenantData of TEST_CONFIG.tenants) {
    await prisma.tenant.upsert({
      where: { id: tenantData.id },
      update: {},
      create: tenantData
    });
    console.log(`✅ Created tenant: ${tenantData.name}`);
  }
}

async function createTestUsers() {
  console.log('👥 Creating test users...');

  const defaultPassword = await hashPassword('password123');

  const usersToCreate = [
    // Tenant 1 Users
    {
      id: 'admin-tenant-1',
      email: 'admin@test-clinic-a.com',
      name: 'Admin User A',
      password: defaultPassword,
      roleId: 'admin',
      tenantId: 'test-tenant-1'
    },
    {
      id: 'vet1-tenant-1',
      email: 'vet1@test-clinic-a.com',
      name: 'Dr. Sarah Johnson',
      password: defaultPassword,
      roleId: 'veterinarian',
      tenantId: 'test-tenant-1'
    },
    {
      id: 'vet2-tenant-1',
      email: 'vet2@test-clinic-a.com',
      name: 'Dr. Michael Chen',
      password: defaultPassword,
      roleId: 'veterinarian',
      tenantId: 'test-tenant-1'
    },
    {
      id: 'owner1-tenant-1',
      email: 'owner1@test-clinic-a.com',
      name: 'John Smith',
      password: defaultPassword,
      roleId: 'owner',
      tenantId: 'test-tenant-1'
    },
    {
      id: 'owner2-tenant-1',
      email: 'owner2@test-clinic-a.com',
      name: 'Emily Davis',
      password: defaultPassword,
      roleId: 'owner',
      tenantId: 'test-tenant-1'
    },
    {
      id: 'staff1-tenant-1',
      email: 'staff1@test-clinic-a.com',
      name: 'Lisa Wilson',
      password: defaultPassword,
      roleId: 'staff',
      tenantId: 'test-tenant-1'
    },

    // Tenant 2 Users
    {
      id: 'admin-tenant-2',
      email: 'admin@test-clinic-b.com',
      name: 'Admin User B',
      password: defaultPassword,
      roleId: 'admin',
      tenantId: 'test-tenant-2'
    },
    {
      id: 'vet1-tenant-2',
      email: 'vet1@test-clinic-b.com',
      name: 'Dr. Robert Martinez',
      password: defaultPassword,
      roleId: 'veterinarian',
      tenantId: 'test-tenant-2'
    },
    {
      id: 'vet2-tenant-2',
      email: 'vet2@test-clinic-b.com',
      name: 'Dr. Amanda Thompson',
      password: defaultPassword,
      roleId: 'veterinarian',
      tenantId: 'test-tenant-2'
    },
    {
      id: 'owner1-tenant-2',
      email: 'owner1@test-clinic-b.com',
      name: 'David Brown',
      password: defaultPassword,
      roleId: 'owner',
      tenantId: 'test-tenant-2'
    },
    {
      id: 'owner2-tenant-2',
      email: 'owner2@test-clinic-b.com',
      name: 'Jennifer Garcia',
      password: defaultPassword,
      roleId: 'owner',
      tenantId: 'test-tenant-2'
    },
    {
      id: 'staff1-tenant-2',
      email: 'staff1@test-clinic-b.com',
      name: 'Mark Anderson',
      password: defaultPassword,
      roleId: 'staff',
      tenantId: 'test-tenant-2'
    },

    // Test same email in different tenants (should be allowed)
    {
      id: 'same-email-tenant-1',
      email: 'same@email.com',
      name: 'Same Email User A',
      password: defaultPassword,
      roleId: 'owner',
      tenantId: 'test-tenant-1'
    },
    {
      id: 'same-email-tenant-2',
      email: 'same@email.com',
      name: 'Same Email User B',
      password: defaultPassword,
      roleId: 'owner',
      tenantId: 'test-tenant-2'
    }
  ];

  for (const user of usersToCreate) {
    await prisma.user.upsert({
      where: { id: user.id },
      update: {},
      create: user
    });
    console.log(`✅ Created user: ${user.name} (${user.email}) - ${user.roleId}`);
  }
}

async function createTestPatients() {
  console.log('🐕 Creating test patients...');

  const patientsToCreate = [
    // Tenant 1 Patients
    {
      id: 'patient1-tenant-1',
      name: 'Buddy',
      speciesId: 'dog',
      breedId: 'golden-retriever',
      gender: 'male',
      birthDate: new Date('2020-03-15'),
      ownerId: 'owner1-tenant-1',
      tenantId: 'test-tenant-1',
      tags: JSON.stringify(['friendly', 'energetic'])
    },
    {
      id: 'patient2-tenant-1',
      name: 'Whiskers',
      speciesId: 'cat',
      breedId: 'persian',
      gender: 'female',
      birthDate: new Date('2019-07-22'),
      ownerId: 'owner1-tenant-1',
      tenantId: 'test-tenant-1',
      tags: JSON.stringify(['calm', 'indoor'])
    },
    {
      id: 'patient3-tenant-1',
      name: 'Max',
      speciesId: 'dog',
      breedId: 'labrador',
      gender: 'male',
      birthDate: new Date('2021-01-10'),
      ownerId: 'owner2-tenant-1',
      tenantId: 'test-tenant-1',
      tags: JSON.stringify(['playful', 'training'])
    },
    {
      id: 'patient4-tenant-1',
      name: 'Luna',
      speciesId: 'cat',
      breedId: 'siamese',
      gender: 'female',
      birthDate: new Date('2020-11-05'),
      ownerId: 'owner2-tenant-1',
      tenantId: 'test-tenant-1',
      tags: JSON.stringify(['vocal', 'curious'])
    },

    // Tenant 2 Patients
    {
      id: 'patient1-tenant-2',
      name: 'Charlie',
      speciesId: 'dog',
      breedId: 'golden-retriever',
      gender: 'male',
      birthDate: new Date('2020-05-20'),
      ownerId: 'owner1-tenant-2',
      tenantId: 'test-tenant-2',
      tags: JSON.stringify(['gentle', 'therapy'])
    },
    {
      id: 'patient2-tenant-2',
      name: 'Mittens',
      speciesId: 'cat',
      breedId: 'persian',
      gender: 'female',
      birthDate: new Date('2019-09-12'),
      ownerId: 'owner1-tenant-2',
      tenantId: 'test-tenant-2',
      tags: JSON.stringify(['shy', 'indoor'])
    },
    {
      id: 'patient3-tenant-2',
      name: 'Rocky',
      speciesId: 'dog',
      breedId: 'labrador',
      gender: 'male',
      birthDate: new Date('2021-03-08'),
      ownerId: 'owner2-tenant-2',
      tenantId: 'test-tenant-2',
      tags: JSON.stringify(['active', 'swimmer'])
    },
    {
      id: 'patient4-tenant-2',
      name: 'Sunny',
      speciesId: 'bird',
      breedId: 'canary',
      gender: 'male',
      birthDate: new Date('2022-01-15'),
      ownerId: 'owner2-tenant-2',
      tenantId: 'test-tenant-2',
      tags: JSON.stringify(['singer', 'bright'])
    }
  ];

  for (const patient of patientsToCreate) {
    await prisma.patient.upsert({
      where: { id: patient.id },
      update: {},
      create: patient
    });
    console.log(`✅ Created patient: ${patient.name} (${patient.speciesId}) - Tenant ${patient.tenantId}`);
  }
}

async function createTestAppointments() {
  console.log('📅 Creating test appointments...');

  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const appointmentsToCreate = [
    // Tenant 1 Appointments
    {
      id: 'appointment1-tenant-1',
      patientId: 'patient1-tenant-1',
      vetId: 'vet1-tenant-1',
      tenantId: 'test-tenant-1',
      date: tomorrow,
      duration: 30,
      reason: 'Annual checkup',
      statusId: 'scheduled',
      notes: 'Regular wellness exam',
      estimatedCost: 75.00
    },
    {
      id: 'appointment2-tenant-1',
      patientId: 'patient2-tenant-1',
      vetId: 'vet2-tenant-1',
      tenantId: 'test-tenant-1',
      date: nextWeek,
      duration: 45,
      reason: 'Vaccination',
      statusId: 'scheduled',
      notes: 'Annual vaccinations due',
      estimatedCost: 120.00
    },
    {
      id: 'appointment3-tenant-1',
      patientId: 'patient3-tenant-1',
      vetId: 'vet1-tenant-1',
      tenantId: 'test-tenant-1',
      date: lastWeek,
      duration: 60,
      reason: 'Injury examination',
      statusId: 'completed',
      notes: 'Minor cut on paw, cleaned and bandaged',
      estimatedCost: 95.00
    },

    // Tenant 2 Appointments
    {
      id: 'appointment1-tenant-2',
      patientId: 'patient1-tenant-2',
      vetId: 'vet1-tenant-2',
      tenantId: 'test-tenant-2',
      date: tomorrow,
      duration: 30,
      reason: 'Follow-up visit',
      statusId: 'scheduled',
      notes: 'Check healing progress',
      estimatedCost: 65.00
    },
    {
      id: 'appointment2-tenant-2',
      patientId: 'patient2-tenant-2',
      vetId: 'vet2-tenant-2',
      tenantId: 'test-tenant-2',
      date: nextWeek,
      duration: 30,
      reason: 'Dental cleaning',
      statusId: 'scheduled',
      notes: 'Routine dental care',
      estimatedCost: 200.00
    },
    {
      id: 'appointment3-tenant-2',
      patientId: 'patient4-tenant-2',
      vetId: 'vet1-tenant-2',
      tenantId: 'test-tenant-2',
      date: lastWeek,
      duration: 15,
      reason: 'Wing clipping',
      statusId: 'completed',
      notes: 'Routine wing maintenance',
      estimatedCost: 25.00
    }
  ];

  for (const appointment of appointmentsToCreate) {
    await prisma.appointment.upsert({
      where: { id: appointment.id },
      update: {},
      create: appointment
    });
    console.log(`✅ Created appointment: ${appointment.reason} - Tenant ${appointment.tenantId}`);
  }
}

async function verifyTestData() {
  console.log('🔍 Verifying test data...');

  // Count records by tenant
  for (const tenant of TEST_CONFIG.tenants) {
    const userCount = await prisma.user.count({ where: { tenantId: tenant.id } });
    const patientCount = await prisma.patient.count({ where: { tenantId: tenant.id } });
    const appointmentCount = await prisma.appointment.count({ where: { tenantId: tenant.id } });

    console.log(`📊 ${tenant.name}:`);
    console.log(`   Users: ${userCount}`);
    console.log(`   Patients: ${patientCount}`);
    console.log(`   Appointments: ${appointmentCount}`);
  }

  // Check for cross-tenant violations
  const crossTenantPatients = await prisma.$queryRaw`
    SELECT a.id as appointment_id, a."tenantId" as appointment_tenant, p."tenantId" as patient_tenant
    FROM appointments a
    JOIN patients p ON a."patientId" = p.id
    WHERE a."tenantId" != p."tenantId"
  `;

  const crossTenantVets = await prisma.$queryRaw`
    SELECT a.id as appointment_id, a."tenantId" as appointment_tenant, u."tenantId" as vet_tenant
    FROM appointments a
    JOIN users u ON a."vetId" = u.id
    WHERE a."tenantId" != u."tenantId"
  `;

  if (Array.isArray(crossTenantPatients) && crossTenantPatients.length > 0) {
    console.log('❌ Found cross-tenant patient violations:', crossTenantPatients.length);
  } else {
    console.log('✅ No cross-tenant patient violations found');
  }

  if (Array.isArray(crossTenantVets) && crossTenantVets.length > 0) {
    console.log('❌ Found cross-tenant vet violations:', crossTenantVets.length);
  } else {
    console.log('✅ No cross-tenant vet violations found');
  }
}

async function printTestCredentials() {
  console.log('\n🔑 TEST USER CREDENTIALS');
  console.log('='.repeat(50));
  console.log('Password for all users: password123\n');

  console.log('🏢 TENANT 1 (test-tenant-1) - Test Clinic A:');
  console.log('  Admin: admin@test-clinic-a.com');
  console.log('  Vets: vet1@test-clinic-a.com, vet2@test-clinic-a.com');
  console.log('  Owners: owner1@test-clinic-a.com, owner2@test-clinic-a.com');
  console.log('  Staff: staff1@test-clinic-a.com');

  console.log('\n🏢 TENANT 2 (test-tenant-2) - Test Clinic B:');
  console.log('  Admin: admin@test-clinic-b.com');
  console.log('  Vets: vet1@test-clinic-b.com, vet2@test-clinic-b.com');
  console.log('  Owners: owner1@test-clinic-b.com, owner2@test-clinic-b.com');
  console.log('  Staff: staff1@test-clinic-b.com');

  console.log('\n🧪 SPECIAL TEST CASES:');
  console.log('  Same email in different tenants: same@email.com (both tenants)');
  
  console.log('\n📋 NEXT STEPS:');
  console.log('1. Use these credentials to test login with different tenants');
  console.log('2. Verify tenant isolation by trying to access other tenant data');
  console.log('3. Run the integration tests: npm run test test/multitenant-integration.spec.ts');
  console.log('4. Import the Postman collection for API testing');
  console.log('5. Run load tests: node test/multitenant-load-test.js');
}

async function main() {
  try {
    console.log('🚀 Setting up multi-tenant test data...\n');

    await createReferenceData();
    await createTestTenants();
    await createTestUsers();
    await createTestPatients();
    await createTestAppointments();
    await verifyTestData();
    await printTestCredentials();

    console.log('\n✅ Test data setup completed successfully!');
  } catch (error) {
    console.error('❌ Error setting up test data:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

export { main as setupTestData };