import { prisma } from '@/server/db/prisma';
import { getStorageDriver } from '@/server/storage/storage';
import { requireRole } from '@/server/rbac/requireRole';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: { documentId: string } }
) {
  const session = await requireRole(['CLINIC_ADMIN','CLINIC_STAFF','PHARMACY_ADMIN','PHARMACY_STAFF']);

  const doc = await prisma.document.findUnique({
    where: { id: params.documentId },
    include: { case: true },
  });

  if (!doc) return new NextResponse('Not found', { status: 404 });

  const allowed = session.role.startsWith('CLINIC')
    ? doc.case.clinicOrgId === session.orgId
    : doc.case.pharmacyOrgId === session.orgId;

  if (!allowed) return new NextResponse('Forbidden', { status: 403 });

  const storage = getStorageDriver();
  const bytes = await storage.getBytes(doc.storageKey);

  // Basic content type detection
  const isDocx = doc.storageKey.endsWith('.docx');
  const contentType = isDocx
    ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    : 'application/pdf';

  const filename = `${doc.type}.${isDocx ? 'docx' : 'pdf'}`;

  return new NextResponse(bytes, {
    status: 200,
    headers: {
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
