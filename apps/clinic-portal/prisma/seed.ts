/**
 * Prisma seed script
 *
 * Creates:
 * - One clinic org
 * - One pharmacy org (Kévin Boivin)
 * - A clinic admin user
 * - A pharmacy admin user
 *
 * NOTE: These are DEV defaults. Change passwords immediately in production.
 */
import { PrismaClient, OrgType, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const clinic = await prisma.organization.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      type: OrgType.CLINIC,
      name: 'Orvio Clinic (Demo)',
    },
  });

  const pharmacy = await prisma.organization.upsert({
    where: { id: '00000000-0000-0000-0000-000000000002' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000002',
      type: OrgType.PHARMACY,
      name: 'Pharmacie Kévin Boivin inc.',
    },
  });

  const clinicAdminEmail = 'clinic.admin@example.com';
  const pharmacyAdminEmail = 'pharmacy.admin@example.com';

  const passwordHash = await bcrypt.hash('changeme', 12);

  const clinicAdmin = await prisma.user.upsert({
    where: { email: clinicAdminEmail },
    update: {},
    create: {
      email: clinicAdminEmail,
      name: 'Clinic Admin',
      passwordHash,
      memberships: {
        create: [{ orgId: clinic.id, role: Role.CLINIC_ADMIN }],
      },
    },
  });

  await prisma.user.upsert({
    where: { email: pharmacyAdminEmail },
    update: {},
    create: {
      email: pharmacyAdminEmail,
      name: 'Pharmacy Admin',
      passwordHash,
      memberships: {
        create: [{ orgId: pharmacy.id, role: Role.PHARMACY_ADMIN }],
      },
    },
  });

  console.log('Seed complete.');
  console.log('Clinic admin:', clinicAdminEmail, 'password: changeme');
  console.log('Pharmacy admin:', pharmacyAdminEmail, 'password: changeme');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
