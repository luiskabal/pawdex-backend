/**
 * MULTITENANT LOAD TESTING SCRIPT
 * 
 * This script tests the multitenant system under concurrent load to verify:
 * - Tenant isolation under stress
 * - Performance consistency across tenants
 * - No data leakage under concurrent operations
 * 
 * Prerequisites:
 * - npm install artillery (for load testing)
 * - Backend server running
 * - Test tenants and users created
 */

const axios = require('axios');
const { performance } = require('perf_hooks');

// Configuration
const CONFIG = {
  baseUrl: 'http://localhost:3000',
  tenants: [
    {
      id: 'test-tenant-1',
      users: [
        { email: 'vet1@test-a.com', password: 'password123', role: 'vet' },
        { email: 'owner1@test-a.com', password: 'password123', role: 'owner' }
      ]
    },
    {
      id: 'test-tenant-2', 
      users: [
        { email: 'vet1@test-b.com', password: 'password123', role: 'vet' },
        { email: 'owner1@test-b.com', password: 'password123', role: 'owner' }
      ]
    }
  ],
  concurrentUsers: 10,
  testDuration: 60000, // 1 minute
  requestInterval: 1000 // 1 second between requests
};

class MultiTenantLoadTester {
  constructor() {
    this.results = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      tenantIsolationViolations: 0,
      averageResponseTime: 0,
      responseTimes: [],
      errors: []
    };
    this.tokens = new Map(); // Store auth tokens per tenant
  }

  /**
   * Authenticate users for all tenants
   */
  async authenticateUsers() {
    console.log('🔐 Authenticating users for all tenants...');
    
    for (const tenant of CONFIG.tenants) {
      this.tokens.set(tenant.id, new Map());
      
      for (const user of tenant.users) {
        try {
          const response = await axios.post(`${CONFIG.baseUrl}/auth/login`, {
            email: user.email,
            password: user.password
          });
          
          this.tokens.get(tenant.id).set(user.email, response.data.access_token);
          console.log(`✅ Authenticated ${user.email} for tenant ${tenant.id}`);
        } catch (error) {
          console.error(`❌ Failed to authenticate ${user.email}:`, error.message);
        }
      }
    }
  }

  /**
   * Get random tenant and user for testing
   */
  getRandomTenantUser() {
    const tenant = CONFIG.tenants[Math.floor(Math.random() * CONFIG.tenants.length)];
    const user = tenant.users[Math.floor(Math.random() * tenant.users.length)];
    const token = this.tokens.get(tenant.id).get(user.email);
    
    return { tenant, user, token };
  }

  /**
   * Create test patient for a tenant
   */
  async createTestPatient(tenantId, token) {
    const patientData = {
      name: `TestPet_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      speciesId: 'dog',
      gender: 'male',
      birthDate: '2020-01-01',
      ownerId: 'test-owner-id' // This should be a valid owner ID
    };

    const response = await axios.post(
      `${CONFIG.baseUrl}/patients`,
      patientData,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    return response.data;
  }

  /**
   * Simulate concurrent patient operations
   */
  async simulatePatientOperations() {
    const { tenant, user, token } = this.getRandomTenantUser();
    const startTime = performance.now();

    try {
      // Create patient
      const patient = await this.createTestPatient(tenant.id, token);
      
      // Verify tenant isolation - patient should belong to correct tenant
      if (patient.tenantId !== tenant.id) {
        this.results.tenantIsolationViolations++;
        console.error(`🚨 TENANT ISOLATION VIOLATION: Patient created with wrong tenantId`);
      }

      // Fetch patients list
      const patientsResponse = await axios.get(
        `${CONFIG.baseUrl}/patients`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      // Verify all returned patients belong to the correct tenant
      const wrongTenantPatients = patientsResponse.data.filter(p => p.tenantId !== tenant.id);
      if (wrongTenantPatients.length > 0) {
        this.results.tenantIsolationViolations += wrongTenantPatients.length;
        console.error(`🚨 TENANT ISOLATION VIOLATION: Found ${wrongTenantPatients.length} patients from wrong tenant`);
      }

      // Update patient
      await axios.patch(
        `${CONFIG.baseUrl}/patients/${patient.id}`,
        { name: `Updated_${patient.name}` },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      // Delete patient
      await axios.delete(
        `${CONFIG.baseUrl}/patients/${patient.id}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      const endTime = performance.now();
      const responseTime = endTime - startTime;
      
      this.results.successfulRequests++;
      this.results.responseTimes.push(responseTime);
      
    } catch (error) {
      this.results.failedRequests++;
      this.results.errors.push({
        tenant: tenant.id,
        user: user.email,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }

    this.results.totalRequests++;
  }

  /**
   * Simulate concurrent appointment operations
   */
  async simulateAppointmentOperations() {
    const { tenant, user, token } = this.getRandomTenantUser();
    const startTime = performance.now();

    try {
      // Fetch appointments
      const appointmentsResponse = await axios.get(
        `${CONFIG.baseUrl}/appointments`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      // Verify all returned appointments belong to the correct tenant
      const wrongTenantAppointments = appointmentsResponse.data.filter(a => a.tenantId !== tenant.id);
      if (wrongTenantAppointments.length > 0) {
        this.results.tenantIsolationViolations += wrongTenantAppointments.length;
        console.error(`🚨 TENANT ISOLATION VIOLATION: Found ${wrongTenantAppointments.length} appointments from wrong tenant`);
      }

      const endTime = performance.now();
      const responseTime = endTime - startTime;
      
      this.results.successfulRequests++;
      this.results.responseTimes.push(responseTime);
      
    } catch (error) {
      this.results.failedRequests++;
      this.results.errors.push({
        tenant: tenant.id,
        user: user.email,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }

    this.results.totalRequests++;
  }

  /**
   * Run concurrent load test
   */
  async runLoadTest() {
    console.log(`🚀 Starting load test with ${CONFIG.concurrentUsers} concurrent users for ${CONFIG.testDuration/1000} seconds...`);
    
    const startTime = Date.now();
    const workers = [];

    // Create concurrent workers
    for (let i = 0; i < CONFIG.concurrentUsers; i++) {
      const worker = this.createWorker(i);
      workers.push(worker);
    }

    // Wait for all workers to complete
    await Promise.all(workers);

    // Calculate results
    this.calculateResults();
    this.printResults();
  }

  /**
   * Create a worker that runs operations for the test duration
   */
  async createWorker(workerId) {
    const endTime = Date.now() + CONFIG.testDuration;
    
    while (Date.now() < endTime) {
      // Randomly choose operation type
      const operations = [
        () => this.simulatePatientOperations(),
        () => this.simulateAppointmentOperations()
      ];
      
      const operation = operations[Math.floor(Math.random() * operations.length)];
      await operation();
      
      // Wait before next request
      await new Promise(resolve => setTimeout(resolve, CONFIG.requestInterval));
    }
  }

  /**
   * Calculate test results
   */
  calculateResults() {
    if (this.results.responseTimes.length > 0) {
      this.results.averageResponseTime = 
        this.results.responseTimes.reduce((a, b) => a + b, 0) / this.results.responseTimes.length;
    }
  }

  /**
   * Print test results
   */
  printResults() {
    console.log('\n📊 LOAD TEST RESULTS');
    console.log('='.repeat(50));
    console.log(`Total Requests: ${this.results.totalRequests}`);
    console.log(`Successful Requests: ${this.results.successfulRequests}`);
    console.log(`Failed Requests: ${this.results.failedRequests}`);
    console.log(`Success Rate: ${((this.results.successfulRequests / this.results.totalRequests) * 100).toFixed(2)}%`);
    console.log(`Average Response Time: ${this.results.averageResponseTime.toFixed(2)}ms`);
    console.log(`🚨 Tenant Isolation Violations: ${this.results.tenantIsolationViolations}`);
    
    if (this.results.responseTimes.length > 0) {
      const sortedTimes = this.results.responseTimes.sort((a, b) => a - b);
      console.log(`Min Response Time: ${sortedTimes[0].toFixed(2)}ms`);
      console.log(`Max Response Time: ${sortedTimes[sortedTimes.length - 1].toFixed(2)}ms`);
      console.log(`95th Percentile: ${sortedTimes[Math.floor(sortedTimes.length * 0.95)].toFixed(2)}ms`);
    }

    if (this.results.errors.length > 0) {
      console.log('\n❌ ERRORS:');
      this.results.errors.forEach((error, index) => {
        console.log(`${index + 1}. [${error.tenant}] ${error.user}: ${error.error}`);
      });
    }

    // Test assessment
    console.log('\n🎯 TEST ASSESSMENT:');
    if (this.results.tenantIsolationViolations === 0) {
      console.log('✅ TENANT ISOLATION: PASSED - No violations detected');
    } else {
      console.log(`❌ TENANT ISOLATION: FAILED - ${this.results.tenantIsolationViolations} violations detected`);
    }

    const successRate = (this.results.successfulRequests / this.results.totalRequests) * 100;
    if (successRate >= 95) {
      console.log('✅ RELIABILITY: PASSED - Success rate >= 95%');
    } else {
      console.log(`❌ RELIABILITY: FAILED - Success rate ${successRate.toFixed(2)}% < 95%`);
    }

    if (this.results.averageResponseTime <= 1000) {
      console.log('✅ PERFORMANCE: PASSED - Average response time <= 1000ms');
    } else {
      console.log(`❌ PERFORMANCE: FAILED - Average response time ${this.results.averageResponseTime.toFixed(2)}ms > 1000ms`);
    }
  }
}

// Cross-tenant access test
async function testCrossTenantAccess() {
  console.log('\n🔒 Testing Cross-Tenant Access Prevention...');
  
  try {
    // Get tokens for different tenants
    const tenant1Token = await authenticateUser('vet1@test-a.com', 'password123');
    const tenant2Token = await authenticateUser('vet1@test-b.com', 'password123');
    
    // Create patient in tenant 1
    const patient = await createPatientInTenant(tenant1Token);
    
    // Try to access patient from tenant 2 (should fail)
    try {
      await axios.get(
        `${CONFIG.baseUrl}/patients/${patient.id}`,
        {
          headers: { Authorization: `Bearer ${tenant2Token}` }
        }
      );
      console.log('❌ CROSS-TENANT ACCESS: FAILED - Tenant 2 could access Tenant 1 patient');
    } catch (error) {
      if (error.response && error.response.status === 404) {
        console.log('✅ CROSS-TENANT ACCESS: PASSED - Tenant 2 cannot access Tenant 1 patient');
      } else {
        console.log('⚠️ CROSS-TENANT ACCESS: UNEXPECTED ERROR -', error.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Cross-tenant test setup failed:', error.message);
  }
}

async function authenticateUser(email, password) {
  const response = await axios.post(`${CONFIG.baseUrl}/auth/login`, {
    email,
    password
  });
  return response.data.access_token;
}

async function createPatientInTenant(token) {
  const response = await axios.post(
    `${CONFIG.baseUrl}/patients`,
    {
      name: `CrossTenantTestPet_${Date.now()}`,
      speciesId: 'dog',
      gender: 'male',
      birthDate: '2020-01-01',
      ownerId: 'test-owner-id'
    },
    {
      headers: { Authorization: `Bearer ${token}` }
    }
  );
  return response.data;
}

// Main execution
async function main() {
  console.log('🧪 MULTITENANT LOAD TESTING SUITE');
  console.log('='.repeat(50));
  
  const tester = new MultiTenantLoadTester();
  
  try {
    // Step 1: Authenticate users
    await tester.authenticateUsers();
    
    // Step 2: Run cross-tenant access test
    await testCrossTenantAccess();
    
    // Step 3: Run load test
    await tester.runLoadTest();
    
  } catch (error) {
    console.error('❌ Load test failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { MultiTenantLoadTester, testCrossTenantAccess };