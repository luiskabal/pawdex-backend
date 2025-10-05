import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Starting feature flags seeding...');

  // Create feature categories
  const categories = [
    {
      id: 'cat_reporting',
      name: 'reporting',
      description: 'Advanced reporting and analytics features',
    },
    {
      id: 'cat_clinic_management',
      name: 'clinic_management',
      description: 'Multi-clinic and advanced management features',
    },
    {
      id: 'cat_billing',
      name: 'billing',
      description: 'Billing and payment processing features',
    },
    {
      id: 'cat_integrations',
      name: 'integrations',
      description: 'Third-party integrations and API access',
    },
    {
      id: 'cat_premium',
      name: 'premium',
      description: 'Premium and enterprise features',
    },
  ];

  console.log('📁 Creating feature categories...');
  for (const category of categories) {
    await prisma.featureCategory.upsert({
      where: { id: category.id },
      update: category,
      create: category,
    });
    console.log(`✅ Created category: ${category.name}`);
  }

  // Create feature flags
  const featureFlags = [
    // Reporting features
    {
      key: 'advanced_reporting',
      name: 'Advanced Reporting',
      description: 'Access to advanced reporting and analytics dashboards',
      categoryId: 'cat_reporting',
      isActive: true,
      isGlobal: false,
    },
    {
      key: 'custom_reports',
      name: 'Custom Reports',
      description: 'Create and customize reports with advanced filters',
      categoryId: 'cat_reporting',
      isActive: true,
      isGlobal: false,
    },
    {
      key: 'export_reports',
      name: 'Export Reports',
      description: 'Export reports to PDF, Excel, and other formats',
      categoryId: 'cat_reporting',
      isActive: true,
      isGlobal: false,
    },

    // Clinic Management features
    {
      key: 'multi_clinic_support',
      name: 'Multi-Clinic Support',
      description: 'Manage multiple clinic locations from one account',
      categoryId: 'cat_clinic_management',
      isActive: true,
      isGlobal: false,
    },
    {
      key: 'staff_scheduling',
      name: 'Staff Scheduling',
      description: 'Advanced staff scheduling and shift management',
      categoryId: 'cat_clinic_management',
      isActive: true,
      isGlobal: false,
    },
    {
      key: 'inventory_management',
      name: 'Inventory Management',
      description: 'Track and manage clinic inventory and supplies',
      categoryId: 'cat_clinic_management',
      isActive: true,
      isGlobal: false,
    },

    // Billing features
    {
      key: 'automated_billing',
      name: 'Automated Billing',
      description: 'Automated invoice generation and payment processing',
      categoryId: 'cat_billing',
      isActive: true,
      isGlobal: false,
    },
    {
      key: 'payment_plans',
      name: 'Payment Plans',
      description: 'Set up payment plans and installments for clients',
      categoryId: 'cat_billing',
      isActive: true,
      isGlobal: false,
    },
    {
      key: 'insurance_integration',
      name: 'Insurance Integration',
      description: 'Integration with pet insurance providers',
      categoryId: 'cat_billing',
      isActive: true,
      isGlobal: false,
    },

    // Integration features
    {
      key: 'api_access',
      name: 'API Access',
      description: 'Access to REST API for custom integrations',
      categoryId: 'cat_integrations',
      isActive: true,
      isGlobal: false,
    },
    {
      key: 'third_party_integrations',
      name: 'Third-Party Integrations',
      description: 'Connect with external veterinary software and services',
      categoryId: 'cat_integrations',
      isActive: true,
      isGlobal: false,
    },
    {
      key: 'webhook_support',
      name: 'Webhook Support',
      description: 'Real-time notifications via webhooks',
      categoryId: 'cat_integrations',
      isActive: true,
      isGlobal: false,
    },

    // Premium features
    {
      key: 'priority_support',
      name: 'Priority Support',
      description: '24/7 priority customer support',
      categoryId: 'cat_premium',
      isActive: true,
      isGlobal: false,
    },
    {
      key: 'white_labeling',
      name: 'White Labeling',
      description: 'Customize the application with your clinic branding',
      categoryId: 'cat_premium',
      isActive: true,
      isGlobal: false,
    },
    {
      key: 'advanced_security',
      name: 'Advanced Security',
      description: 'Enhanced security features and compliance tools',
      categoryId: 'cat_premium',
      isActive: true,
      isGlobal: false,
    },

    // Global features (available to all users)
    {
      key: 'basic_appointments',
      name: 'Basic Appointments',
      description: 'Basic appointment scheduling functionality',
      categoryId: null,
      isActive: true,
      isGlobal: true,
    },
    {
      key: 'patient_records',
      name: 'Patient Records',
      description: 'Basic patient record management',
      categoryId: null,
      isActive: true,
      isGlobal: true,
    },
  ];

  console.log('🏁 Creating feature flags...');
  for (const flag of featureFlags) {
    await prisma.featureFlag.upsert({
      where: { key: flag.key },
      update: flag,
      create: flag,
    });
    console.log(`✅ Created feature flag: ${flag.key}`);
  }

  // Assign feature flags to roles
  console.log('🔗 Assigning feature flags to roles...');

  // Get all roles
  const roles = await prisma.userRole.findMany();
  const roleMap = roles.reduce((acc, role) => {
    acc[role.name] = role.id;
    return acc;
  }, {} as Record<string, string>);

  // Get all feature flags
  const allFlags = await prisma.featureFlag.findMany();
  const flagMap = allFlags.reduce((acc, flag) => {
    acc[flag.key] = flag.id;
    return acc;
  }, {} as Record<string, string>);

  // Role-based feature flag assignments
  const roleAssignments = [
    // Admin gets all features
    {
      roleName: 'admin',
      featureFlags: Object.keys(flagMap).filter(key => !key.startsWith('basic_') && !key.startsWith('patient_')),
    },
    // Veterinarian gets clinical and some management features
    {
      roleName: 'veterinarian',
      featureFlags: [
        'advanced_reporting',
        'custom_reports',
        'export_reports',
        'inventory_management',
        'api_access',
      ],
    },
    // Receptionist gets basic management features
    {
      roleName: 'receptionist',
      featureFlags: [
        'staff_scheduling',
        'automated_billing',
        'payment_plans',
      ],
    },
    // Assistant gets limited features
    {
      roleName: 'assistant',
      featureFlags: [
        'inventory_management',
      ],
    },
    // Customer gets very limited features
    {
      roleName: 'customer',
      featureFlags: [
        // Customers only get global features by default
      ],
    },
  ];

  for (const assignment of roleAssignments) {
    const roleId = roleMap[assignment.roleName];
    if (!roleId) {
      console.log(`⚠️  Role '${assignment.roleName}' not found, skipping...`);
      continue;
    }

    for (const flagKey of assignment.featureFlags) {
      const flagId = flagMap[flagKey];
      if (!flagId) {
        console.log(`⚠️  Feature flag '${flagKey}' not found, skipping...`);
        continue;
      }

      await prisma.roleFeatureFlag.upsert({
        where: {
          roleId_featureFlagId: {
            roleId,
            featureFlagId: flagId,
          },
        },
        update: {
          isEnabled: true,
        },
        create: {
          roleId,
          featureFlagId: flagId,
          isEnabled: true,
        },
      });
    }

    console.log(`✅ Assigned ${assignment.featureFlags.length} feature flags to ${assignment.roleName}`);
  }

  console.log('🎉 Feature flags seeding completed!');

  // Display summary
  const totalCategories = await prisma.featureCategory.count();
  const totalFlags = await prisma.featureFlag.count();
  const totalAssignments = await prisma.roleFeatureFlag.count();

  console.log('\n📊 Summary:');
  console.log(`   Categories: ${totalCategories}`);
  console.log(`   Feature Flags: ${totalFlags}`);
  console.log(`   Role Assignments: ${totalAssignments}`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding feature flags:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });