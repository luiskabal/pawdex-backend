import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function createTestUsers() {
  try {
    console.log('🧪 Creating additional test users...');

    // Default password for all test users
    const defaultPassword = await bcrypt.hash('password123', 10);

    // Additional test users with different roles
    const testUsers = [
      {
        email: 'assistant@pawdex.com',
        name: 'Sarah Assistant',
        roleId: 'assistant',
        password: defaultPassword,
      },
      {
        email: 'vet.tech@pawdex.com',
        name: 'Mike Tech',
        roleId: 'assistant',
        password: defaultPassword,
      },
      {
        email: 'dr.wilson@pawdex.com',
        name: 'Dr. Emily Wilson',
        roleId: 'veterinarian',
        password: defaultPassword,
      },
      {
        email: 'front.desk@pawdex.com',
        name: 'Lisa Front',
        roleId: 'receptionist',
        password: defaultPassword,
      },
      {
        email: 'customer2@pawdex.com',
        name: 'Mary Pet Owner',
        roleId: 'customer',
        password: defaultPassword,
      },
      {
        email: 'customer3@pawdex.com',
        name: 'Bob Dog Walker',
        roleId: 'customer',
        password: defaultPassword,
      },
      {
        email: 'test.admin@pawdex.com',
        name: 'Test Admin',
        roleId: 'admin',
        password: defaultPassword,
      }
    ];

    let createdCount = 0;
    let skippedCount = 0;

    for (const userData of testUsers) {
      try {
        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
          where: { email: userData.email }
        });

        if (existingUser) {
          console.log(`⏭️  Skipped ${userData.email} (already exists)`);
          skippedCount++;
          continue;
        }

        // Create the user
        const user = await prisma.user.create({
          data: userData,
          include: {
            role: true
          }
        });

        console.log(`✅ Created ${user.email} (${user.name}) - Role: ${user.role.name}`);
        createdCount++;

      } catch (error) {
        console.error(`❌ Failed to create ${userData.email}:`, error.message);
      }
    }

    console.log(`\n📊 Summary:`);
    console.log(`   Created: ${createdCount} users`);
    console.log(`   Skipped: ${skippedCount} users`);
    console.log(`   Total: ${createdCount + skippedCount} users processed`);

    // Show all users
    console.log('\n👥 All users in database:');
    const allUsers = await prisma.user.findMany({
      include: {
        role: true
      },
      orderBy: {
        role: {
          name: 'asc'
        }
      }
    });

    allUsers.forEach(user => {
      console.log(`   ${user.email} (${user.name}) - ${user.role.name}`);
    });

    console.log('\n🔑 Login credentials for all users:');
    console.log('   Email: [any user email above]');
    console.log('   Password: password123');

  } catch (error) {
    console.error('Error creating test users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestUsers();