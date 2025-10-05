import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkRoles() {
  try {
    const roles = await prisma.userRole.findMany({
      include: {
        permissions: {
          include: {
            permission: true
          }
        }
      }
    });
    
    console.log('Available roles:');
    roles.forEach(role => {
      console.log(`\n- ${role.id}: ${role.name}`);
      console.log(`  Description: ${role.description}`);
      console.log(`  Permissions: ${role.permissions.length}`);
    });

    const users = await prisma.user.findMany({
      include: {
        role: true
      }
    });

    console.log('\nExisting users:');
    users.forEach(user => {
      console.log(`- ${user.email} (${user.name}) - Role: ${user.role.name}`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkRoles();