import { PrismaClient } from '@prisma/client';

// In dev, preserve a single Prisma client across HMR reloads.
// In prod, create a new client per process.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['error', 'warn'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
