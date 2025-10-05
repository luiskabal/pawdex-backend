import { PrismaClient } from '@prisma/client';

// Serverless-friendly Prisma client management
export async function withPrisma<T>(
  operation: (prisma: PrismaClient) => Promise<T>
): Promise<T> {
  const prisma = new PrismaClient();
  try {
    return await operation(prisma);
  } finally {
    await prisma.$disconnect();
  }
}