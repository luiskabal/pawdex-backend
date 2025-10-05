import axios from 'axios';

const API_BASE = 'http://localhost:3001/api';

interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    name: string;
    roleId: string;
    role: {
      id: string;
      name: string;
    };
  };
}

async function testUserLogin(email: string, password: string) {
  try {
    console.log(`\n🔐 Testing login for: ${email}`);
    
    const response = await axios.post<LoginResponse>(`${API_BASE}/auth/login`, {
      email,
      password
    });

    const { user, accessToken } = response.data;
    
    console.log(`✅ Login successful!`);
    console.log(`   User: ${user.name} (${user.email})`);
    console.log(`   Role: ${user.role.name} (${user.role.id})`);

    // Get user permissions
    let permissions: string[] = [];
    try {
      const permissionsResponse = await axios.get<string[]>(`${API_BASE}/permissions/user/me`, {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });
      permissions = permissionsResponse.data;
      console.log(`   Permissions (${permissions.length}):`);
      permissions.forEach(permission => {
        console.log(`     - ${permission}`);
      });
    } catch (error) {
      console.log(`❌ Failed to get permissions: ${error.response?.data?.message || error.message}`);
    }

    // Test a protected endpoint
    try {
      const profileResponse = await axios.get(`${API_BASE}/auth/profile`, {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });
      console.log(`✅ Profile access successful`);
    } catch (error) {
      console.log(`❌ Profile access failed: ${error.response?.data?.message || error.message}`);
    }

    return { success: true, user, permissions, token: accessToken };

  } catch (error) {
    console.log(`❌ Login failed: ${error.response?.data?.message || error.message}`);
    return { success: false, error: error.response?.data?.message || error.message };
  }
}

async function testPermissionEndpoint(token: string, endpoint: string, method: string = 'GET') {
  try {
    const config = {
      method: method.toLowerCase(),
      url: `${API_BASE}${endpoint}`,
      headers: {
        Authorization: `Bearer ${token}`
      }
    };

    const response = await axios(config);
    console.log(`✅ ${method} ${endpoint} - Success (${response.status})`);
    return true;
  } catch (error) {
    const status = error.response?.status;
    const message = error.response?.data?.message || error.message;
    console.log(`❌ ${method} ${endpoint} - Failed (${status}): ${message}`);
    return false;
  }
}

async function runAuthTests() {
  console.log('🧪 Starting Authentication and Permission Tests');
  console.log('=' .repeat(60));

  const testUsers = [
    { email: 'admin@pawdex.com', role: 'Admin' },
    { email: 'dr.smith@pawdex.com', role: 'Veterinarian' },
    { email: 'reception@pawdex.com', role: 'Receptionist' },
    { email: 'assistant@pawdex.com', role: 'Assistant' },
    { email: 'customer@pawdex.com', role: 'Customer' },
  ];

  const testResults = [];

  for (const testUser of testUsers) {
    const result = await testUserLogin(testUser.email, 'password123');
    testResults.push({
      ...testUser,
      ...result
    });

    if (result.success) {
      console.log(`\n🔍 Testing endpoints for ${testUser.role}:`);
      
      // Test common endpoints
      await testPermissionEndpoint(result.token, '/roles');
      await testPermissionEndpoint(result.token, '/permissions');
      await testPermissionEndpoint(result.token, '/patients');
      await testPermissionEndpoint(result.token, '/appointments');
    }

    console.log('-'.repeat(40));
  }

  // Summary
  console.log('\n📊 Test Summary:');
  console.log('=' .repeat(60));
  
  testResults.forEach(result => {
    const status = result.success ? '✅' : '❌';
    console.log(`${status} ${result.email} (${result.role})`);
    if (result.success) {
      console.log(`   Permissions: ${result.permissions.length}`);
    } else {
      console.log(`   Error: ${result.error}`);
    }
  });

  console.log('\n🔑 All test users use password: password123');
}

// Run the tests
runAuthTests().catch(console.error);