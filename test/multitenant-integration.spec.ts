import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Multitenant Integration Tests', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  
  // Test data for multiple tenants
  const tenant1 = {
    id: 'test-tenant-1',
    name: 'Clinic A',
    subdomain: 'clinic-a',
    slug: 'clinic-a',
    email: 'admin@clinic-a.com'
  };
  
  const tenant2 = {
    id: 'test-tenant-2', 
    name: 'Clinic B',
    subdomain: 'clinic-b',
    slug: 'clinic-b',
    email: 'admin@clinic-b.com'
  };

  let tenant1Token: string;
  let tenant2Token: string;
  let tenant1UserId: string;
  let tenant2UserId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = moduleFixture.get<PrismaService>(PrismaService);
    
    await app.init();
    
    // Setup test data
    await setupTestData();
  });

  afterAll(async () => {
    await cleanupTestData();
    await app.close();
  });

  describe('Tenant Isolation - Appointments', () => {
    let tenant1PatientId: string;
    let tenant2PatientId: string;
    let tenant1AppointmentId: string;
    let tenant2AppointmentId: string;

    beforeEach(async () => {
      // Create patients for each tenant
      const patient1Response = await request(app.getHttpServer())
        .post('/api/patients')
        .set('Authorization', `Bearer ${tenant1Token}`)
        .send({
          name: 'Buddy',
          speciesId: 'dog',
          gender: 'male',
          birthDate: '2020-01-01',
          ownerId: tenant1UserId
        });
      tenant1PatientId = patient1Response.body.id;

      const patient2Response = await request(app.getHttpServer())
        .post('/api/patients')
        .set('Authorization', `Bearer ${tenant2Token}`)
        .send({
          name: 'Fluffy',
          speciesId: 'cat',
          gender: 'female',
          birthDate: '2021-01-01',
          ownerId: tenant2UserId
        });
      tenant2PatientId = patient2Response.body.id;

      // Create appointments for each tenant
      const appointment1Response = await request(app.getHttpServer())
        .post('/api/appointments')
        .set('Authorization', `Bearer ${tenant1Token}`)
        .send({
          patientId: tenant1PatientId,
          vetId: tenant1UserId,
          date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          duration: 30,
          reason: 'checkup'
        });
      tenant1AppointmentId = appointment1Response.body.id;

      const appointment2Response = await request(app.getHttpServer())
        .post('/api/appointments')
        .set('Authorization', `Bearer ${tenant2Token}`)
        .send({
          patientId: tenant2PatientId,
          vetId: tenant2UserId,
          date: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
          duration: 45,
          reason: 'vaccination'
        });
      tenant2AppointmentId = appointment2Response.body.id;
    });

    it('should only return appointments for the authenticated tenant', async () => {
      // Tenant 1 should only see their appointments
      const tenant1Response = await request(app.getHttpServer())
        .get('/api/appointments')
        .set('Authorization', `Bearer ${tenant1Token}`)
        .expect(200);

      expect(tenant1Response.body.data).toHaveLength(1);
      expect(tenant1Response.body.data[0].id).toBe(tenant1AppointmentId);
      expect(tenant1Response.body.data[0].patient.name).toBe('Buddy');

      // Tenant 2 should only see their appointments
      const tenant2Response = await request(app.getHttpServer())
        .get('/api/appointments')
        .set('Authorization', `Bearer ${tenant2Token}`)
        .expect(200);

      expect(tenant2Response.body.data).toHaveLength(1);
      expect(tenant2Response.body.data[0].id).toBe(tenant2AppointmentId);
      expect(tenant2Response.body.data[0].patient.name).toBe('Fluffy');
    });

    it('should prevent cross-tenant appointment access', async () => {
      // Tenant 1 trying to access Tenant 2's appointment
      await request(app.getHttpServer())
        .get(`/api/appointments/${tenant2AppointmentId}`)
        .set('Authorization', `Bearer ${tenant1Token}`)
        .expect(404);

      // Tenant 2 trying to access Tenant 1's appointment
      await request(app.getHttpServer())
        .get(`/api/appointments/${tenant1AppointmentId}`)
        .set('Authorization', `Bearer ${tenant2Token}`)
        .expect(404);
    });

    it('should prevent cross-tenant appointment updates', async () => {
      // Tenant 1 trying to update Tenant 2's appointment
      await request(app.getHttpServer())
        .patch(`/api/appointments/${tenant2AppointmentId}`)
        .set('Authorization', `Bearer ${tenant1Token}`)
        .send({ duration: 60 })
        .expect(404);

      // Tenant 2 trying to update Tenant 1's appointment
      await request(app.getHttpServer())
        .patch(`/api/appointments/${tenant1AppointmentId}`)
        .set('Authorization', `Bearer ${tenant2Token}`)
        .send({ duration: 60 })
        .expect(404);
    });

    it('should prevent cross-tenant patient access in appointment creation', async () => {
      // Tenant 1 trying to create appointment with Tenant 2's patient
      await request(app.getHttpServer())
        .post('/api/appointments')
        .set('Authorization', `Bearer ${tenant1Token}`)
        .send({
          patientId: tenant2PatientId, // Cross-tenant patient
          vetId: tenant1UserId,
          date: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(),
          duration: 30,
          reason: 'checkup'
        })
        .expect(404); // Should fail because patient doesn't exist in tenant 1
    });
  });

  describe('Tenant Data Cascade', () => {
    it('should cascade delete all tenant data when tenant is deleted', async () => {
      // Create a test tenant with data
      const testTenant = await prisma.tenant.create({
        data: {
          id: 'cascade-test-tenant',
          name: 'Cascade Test Clinic',
          subdomain: 'cascade-test',
          slug: 'cascade-test',
          email: 'test@cascade.com'
        }
      });

      // Create user, patient, and appointment for this tenant
      const user = await prisma.user.create({
        data: {
          tenantId: testTenant.id,
          email: 'vet@cascade.com',
          name: 'Test Vet',
          password: 'hashedpassword',
          roleId: 'vet-role-id'
        }
      });

      const patient = await prisma.patient.create({
        data: {
          tenantId: testTenant.id,
          name: 'Test Pet',
          speciesId: 'dog',
          gender: 'male',
          birthDate: new Date('2020-01-01'),
          ownerId: user.id
        }
      });

      const appointment = await prisma.appointment.create({
        data: {
          tenantId: testTenant.id,
          patientId: patient.id,
          vetId: user.id,
          statusId: 'scheduled',
          date: new Date(Date.now() + 24 * 60 * 60 * 1000),
          duration: 30,
          reason: 'checkup'
        }
      });

      // Verify data exists
      expect(await prisma.user.findUnique({ where: { id: user.id } })).toBeTruthy();
      expect(await prisma.patient.findUnique({ where: { id: patient.id } })).toBeTruthy();
      expect(await prisma.appointment.findUnique({ where: { id: appointment.id } })).toBeTruthy();

      // Delete tenant (should cascade)
      await prisma.tenant.delete({ where: { id: testTenant.id } });

      // Verify all related data is deleted
      expect(await prisma.user.findUnique({ where: { id: user.id } })).toBeNull();
      expect(await prisma.patient.findUnique({ where: { id: patient.id } })).toBeNull();
      expect(await prisma.appointment.findUnique({ where: { id: appointment.id } })).toBeNull();
    });
  });

  // Helper functions
  async function setupTestData() {
    // Create tenants
    await prisma.tenant.createMany({
      data: [tenant1, tenant2],
      skipDuplicates: true
    });

    // Create users for each tenant (simplified - in real app you'd hash passwords)
    const user1 = await prisma.user.create({
      data: {
        tenantId: tenant1.id,
        email: 'vet1@clinic-a.com',
        name: 'Dr. Smith',
        password: 'hashedpassword1',
        roleId: 'vet-role-id'
      }
    });
    tenant1UserId = user1.id;

    const user2 = await prisma.user.create({
      data: {
        tenantId: tenant2.id,
        email: 'vet2@clinic-b.com',
        name: 'Dr. Jones',
        password: 'hashedpassword2',
        roleId: 'vet-role-id'
      }
    });
    tenant2UserId = user2.id;

    // Generate JWT tokens (simplified - use your actual auth service)
    tenant1Token = 'mock-jwt-token-tenant-1';
    tenant2Token = 'mock-jwt-token-tenant-2';
  }

  async function cleanupTestData() {
    // Clean up test data
    await prisma.appointment.deleteMany({
      where: {
        tenantId: { in: [tenant1.id, tenant2.id] }
      }
    });
    
    await prisma.patient.deleteMany({
      where: {
        tenantId: { in: [tenant1.id, tenant2.id] }
      }
    });
    
    await prisma.user.deleteMany({
      where: {
        tenantId: { in: [tenant1.id, tenant2.id] }
      }
    });
    
    await prisma.tenant.deleteMany({
      where: {
        id: { in: [tenant1.id, tenant2.id] }
      }
    });
  }
});