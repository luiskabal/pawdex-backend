import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Clear existing data (in correct order due to foreign keys)
  await prisma.appointment.deleteMany();
  await prisma.patient.deleteMany();
  await prisma.user.deleteMany();
  await prisma.rolePermission.deleteMany();
  await prisma.permission.deleteMany();
  await prisma.breed.deleteMany();
  await prisma.species.deleteMany();
  await prisma.appointmentStatus.deleteMany();
  await prisma.userRole.deleteMany();
  await prisma.tenant.deleteMany();

  console.log('🗑️  Cleared existing data');

  // Create default tenant
  const defaultTenant = await prisma.tenant.create({
    data: {
      id: 'default-tenant',
      name: 'PawDex Veterinary Clinic',
      slug: 'default',
      subdomain: 'default',
      email: 'info@pawdex.com',
      phone: '+1-555-0123',
      address: '123 Main Street, Anytown, ST 12345',
      settings: {},
      isActive: true,
    },
  });
  console.log(`🏢 Created default tenant: ${defaultTenant.name}`);

  // Seed User Roles with human-readable IDs
  const userRoles = await prisma.userRole.createMany({
    data: [
      { id: 'admin', name: 'admin', description: 'System administrator' },
      { id: 'veterinarian', name: 'vet', description: 'Veterinarian' },
      { id: 'receptionist', name: 'receptionist', description: 'Front desk receptionist' },
      { id: 'assistant', name: 'assistant', description: 'Veterinary assistant' },
      { id: 'customer', name: 'customer', description: 'Pet owner/customer' },
    ],
  });
  console.log(`👥 Created ${userRoles.count} user roles`);

  // Seed Permissions
  const permissions = await prisma.permission.createMany({
    data: [
      // Patient permissions
      { name: 'patients.create', description: 'Create new patients' },
      { name: 'patients.read', description: 'View patient information' },
      { name: 'patients.read:own', description: 'View own patients only' },
      { name: 'patients.update', description: 'Update patient information' },
      { name: 'patients.update:own', description: 'Update own patients only' },
      { name: 'patients.delete', description: 'Delete patients' },
      
      // Appointment permissions
      { name: 'appointments.create', description: 'Create new appointments' },
      { name: 'appointments.read', description: 'View all appointments' },
      { name: 'appointments.read:own', description: 'View own appointments only' },
      { name: 'appointments.update', description: 'Update appointments' },
      { name: 'appointments.update:own', description: 'Update own appointments only' },
      { name: 'appointments.delete', description: 'Delete appointments' },
      
      // User management permissions
      { name: 'users.create', description: 'Create new users' },
      { name: 'users.read', description: 'View user information' },
      { name: 'users.update', description: 'Update user information' },
      { name: 'users.delete', description: 'Delete users' },
      
      // Role management permissions
      { name: 'roles.create', description: 'Create new roles' },
      { name: 'roles.read', description: 'View roles' },
      { name: 'roles.update', description: 'Update roles' },
      { name: 'roles.delete', description: 'Delete roles' },
      
      // Permission management
      { name: 'permissions.read', description: 'View permissions' },
      { name: 'permissions.assign', description: 'Assign permissions to roles' },
      
      // System administration
      { name: 'system.admin', description: 'Full system administration access' },
    ],
  });
  console.log(`🔐 Created ${permissions.count} permissions`);

  // Create role-permission mappings based on the matrix
  const rolePermissionMappings = [
    // Admin - all permissions (system.admin gives full access)
    { roleId: 'admin', permissionName: 'system.admin' },
    
    // Veterinarian permissions
    { roleId: 'veterinarian', permissionName: 'patients.read' },
    { roleId: 'veterinarian', permissionName: 'patients.update' },
    { roleId: 'veterinarian', permissionName: 'appointments.read' },
    { roleId: 'veterinarian', permissionName: 'appointments.update' },
    { roleId: 'veterinarian', permissionName: 'appointments.create' },
    
    // Receptionist permissions
    { roleId: 'receptionist', permissionName: 'patients.read' },
    { roleId: 'receptionist', permissionName: 'patients.create' },
    { roleId: 'receptionist', permissionName: 'patients.update' },
    { roleId: 'receptionist', permissionName: 'appointments.create' },
    { roleId: 'receptionist', permissionName: 'appointments.read' },
    { roleId: 'receptionist', permissionName: 'appointments.update' },
    
    // Customer permissions
    { roleId: 'customer', permissionName: 'patients.read:own' },
    { roleId: 'customer', permissionName: 'patients.update:own' },
    { roleId: 'customer', permissionName: 'appointments.create' },
    { roleId: 'customer', permissionName: 'appointments.read:own' },
    { roleId: 'customer', permissionName: 'appointments.update:own' },
  ];

  // Get all permissions to map names to IDs
  const allPermissions = await prisma.permission.findMany();
  const permissionMap = new Map(allPermissions.map(p => [p.name, p.id]));

  // Create role-permission relationships
  for (const mapping of rolePermissionMappings) {
    const permissionId = permissionMap.get(mapping.permissionName);
    if (permissionId) {
      await prisma.rolePermission.create({
        data: {
          roleId: mapping.roleId,
          permissionId: permissionId,
        },
      });
    }
  }
  console.log(`🔗 Created ${rolePermissionMappings.length} role-permission mappings`);

  // Seed Appointment Statuses with human-readable IDs
  const appointmentStatuses = await prisma.appointmentStatus.createMany({
    data: [
      { id: 'scheduled', name: 'scheduled', description: 'Appointment is scheduled' },
      { id: 'confirmed', name: 'confirmed', description: 'Appointment is confirmed' },
      { id: 'in-progress', name: 'in-progress', description: 'Appointment is currently happening' },
      { id: 'completed', name: 'completed', description: 'Appointment has been completed' },
      { id: 'cancelled', name: 'cancelled', description: 'Appointment was cancelled' },
      { id: 'no-show', name: 'no-show', description: 'Patient did not show up' },
    ],
  });
  console.log(`📅 Created ${appointmentStatuses.count} appointment statuses`);

  // Seed Species with human-readable IDs
  const speciesData = [
    { id: 'dog', name: 'dog' },
    { id: 'cat', name: 'cat' },
    { id: 'bird', name: 'bird' },
    { id: 'rabbit', name: 'rabbit' },
    { id: 'hamster', name: 'hamster' },
    { id: 'guinea-pig', name: 'guinea-pig' },
    { id: 'ferret', name: 'ferret' },
    { id: 'reptile', name: 'reptile' },
    { id: 'fish', name: 'fish' },
    { id: 'other', name: 'other' },
  ];

  const createdSpecies = [];
  for (const species of speciesData) {
    const created = await prisma.species.create({ data: species });
    createdSpecies.push(created);
  }
  console.log(`🐾 Created ${createdSpecies.length} species`);

  // Seed Breeds by Species
  const breedsBySpecies = {
    dog: [
      'Golden Retriever', 'Labrador Retriever', 'German Shepherd', 'Bulldog',
      'Poodle', 'Beagle', 'Rottweiler', 'Yorkshire Terrier', 'Dachshund',
      'Siberian Husky', 'Boxer', 'Border Collie', 'Chihuahua', 'Shih Tzu',
      'Boston Terrier', 'Pomeranian', 'Australian Shepherd', 'Cocker Spaniel',
      'Mixed Breed', 'Unknown'
    ],
    cat: [
      'Persian', 'Maine Coon', 'British Shorthair', 'Ragdoll', 'Bengal',
      'Abyssinian', 'Birman', 'Oriental Shorthair', 'Devon Rex', 'Cornish Rex',
      'Scottish Fold', 'Sphynx', 'American Shorthair', 'Russian Blue',
      'Siamese', 'Norwegian Forest Cat', 'Domestic Shorthair', 'Domestic Longhair',
      'Mixed Breed', 'Unknown'
    ],
    bird: [
      'Canary', 'Budgerigar', 'Cockatiel', 'Lovebird', 'Conure', 'Macaw',
      'African Grey', 'Cockatoo', 'Finch', 'Parakeet', 'Parrotlet',
      'Caique', 'Eclectus', 'Amazon Parrot', 'Unknown'
    ],
    rabbit: [
      'Holland Lop', 'Netherland Dwarf', 'Mini Rex', 'Lionhead', 'Flemish Giant',
      'English Angora', 'Dutch', 'Mini Lop', 'Rex', 'New Zealand',
      'Californian', 'Himalayan', 'Mixed Breed', 'Unknown'
    ],
    hamster: [
      'Syrian', 'Dwarf Campbell Russian', 'Dwarf Winter White Russian',
      'Roborovski', 'Chinese', 'European', 'Unknown'
    ],
    'guinea-pig': [
      'American', 'Abyssinian', 'Peruvian', 'Silkie', 'Teddy', 'Texel',
      'Coronet', 'Lunkarya', 'Mixed Breed', 'Unknown'
    ],
    ferret: [
      'Domestic Ferret', 'Angora Ferret', 'Unknown'
    ],
    reptile: [
      'Bearded Dragon', 'Leopard Gecko', 'Ball Python', 'Corn Snake',
      'Blue-Tongued Skink', 'Green Iguana', 'Red-Eared Slider', 'Tortoise',
      'Chameleon', 'Monitor Lizard', 'Unknown'
    ],
    fish: [
      'Goldfish', 'Betta', 'Guppy', 'Angelfish', 'Neon Tetra', 'Molly',
      'Platy', 'Swordtail', 'Corydoras', 'Discus', 'Cichlid', 'Unknown'
    ],
    other: [
      'Unknown', 'Mixed Species', 'Exotic'
    ]
  };

  let totalBreeds = 0;
  for (const species of createdSpecies) {
    const breeds = breedsBySpecies[species.name as keyof typeof breedsBySpecies];
    if (breeds) {
      const breedData = breeds.map(breedName => ({
        id: `${species.id}-${breedName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')}`,
        name: breedName,
        speciesId: species.id,
      }));
      
      const createdBreeds = await prisma.breed.createMany({
        data: breedData,
      });
      totalBreeds += createdBreeds.count;
    }
  }
  console.log(`🏷️  Created ${totalBreeds} breeds`);

  // Create sample users with proper role connections and hashed passwords
  const defaultPassword = await bcrypt.hash('password123', 10);
  
  // Get role IDs
  const adminRole = await prisma.userRole.findFirst({ where: { name: 'admin' } });
  const vetRole = await prisma.userRole.findFirst({ where: { name: 'vet' } });
  const receptionRole = await prisma.userRole.findFirst({ where: { name: 'receptionist' } });
  const customerRole = await prisma.userRole.findFirst({ where: { name: 'customer' } });
  
  // Use the created tenant for users
  
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@pawdex.com',
      name: 'Admin User',
      roleId: adminRole!.id,
      tenantId: defaultTenant.id,
      password: defaultPassword,
    },
  });

  const drSmith = await prisma.user.create({
    data: {
      email: 'dr.smith@pawdex.com',
      name: 'Dr. Sarah Smith',
      roleId: vetRole!.id,
      tenantId: defaultTenant.id,
      password: defaultPassword,
    },
  });

  const drJohnson = await prisma.user.create({
    data: {
      email: 'dr.johnson@pawdex.com',
      name: 'Dr. Michael Johnson',
      roleId: vetRole!.id,
      tenantId: defaultTenant.id,
      password: defaultPassword,
    },
  });

  const reception = await prisma.user.create({
    data: {
      email: 'reception@pawdex.com',
      name: 'Jane Doe',
      roleId: receptionRole!.id,
      tenantId: defaultTenant.id,
      password: defaultPassword,
    },
  });

  const customer = await prisma.user.create({
    data: {
      email: 'customer@pawdex.com',
      name: 'John Customer',
      roleId: customerRole!.id,
      tenantId: defaultTenant.id,
      password: defaultPassword,
    },
  });

  console.log(`👨‍⚕️ Created 5 users with default password`);

  console.log('✅ Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });