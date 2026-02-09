import crypto from 'node:crypto';
import { prisma } from '@/server/db/prisma';
import { getESignProvider } from '@/server/esign';
import { getStorageDriver } from '@/server/storage/storage';
import { requireRole } from '@/server/rbac/requireRole';

// Centralized access check for a case.
// Keep this in ONE place so you don't miss RBAC edge cases.
export async function getCaseForSessionOrThrow(caseId: string) {
  const session = await requireRole(['CLINIC_ADMIN','CLINIC_STAFF','PHARMACY_ADMIN','PHARMACY_STAFF']);

  const c = await prisma.case.findUnique({
    where: { id: caseId },
    include: { patient: true, documents: true, envelope: true },
  });

  if (!c) throw new Error('Case not found');

  const allowed = session.role.startsWith('CLINIC')
    ? c.clinicOrgId === session.orgId
    : c.pharmacyOrgId === session.orgId;

  if (!allowed) throw new Error('Forbidden');

  return { session, c };
}

/**
 * Start signing:
 * - Creates (or re-creates) an envelope for this case
 * - Runs the provider (mock for now) and stores completed documents
 * - Sets status to SIGNED
 *
 * IMPORTANT for real DocuSign:
 * - Patient signs first (in-person signing on iPad/laptop)
 * - Doctor signs second (embedded signing; signature adoption means it's 1-tap)
 */
export async function startSigning(caseId: string) {
  const { session, c } = await getCaseForSessionOrThrow(caseId);

  const provider = getESignProvider();
  const storage = getStorageDriver();

  // Create + complete envelope (mock completes immediately)
  const result = await provider.createAndCompleteEnvelope({
    caseId: c.id,
    language: c.language,
  });

  const envelope = await prisma.envelope.upsert({
    where: { caseId: c.id },
    update: {
      provider: result.envelope.provider,
      providerEnvelopeId: result.envelope.providerEnvelopeId,
      status: 'completed',
      sentAt: new Date(),
      completedAt: new Date(),
    },
    create: {
      caseId: c.id,
      provider: result.envelope.provider,
      providerEnvelopeId: result.envelope.providerEnvelopeId,
      status: 'completed',
      sentAt: new Date(),
      completedAt: new Date(),
    },
  });

  // Store docs + attach to case
  for (const doc of result.completedDocs) {
    const ext = doc.type === 'PHARMACY_CONSENT' ? 'docx' : 'pdf';
    const storageKey = `cases/${c.id}/${crypto.randomUUID()}.${doc.type.toLowerCase()}.${ext}`;

    const stored = await storage.putBytes(storageKey, doc.pdfBytes);

    await prisma.document.create({
      data: {
        caseId: c.id,
        type: doc.type,
        language: c.language,
        templateVersion: doc.templateVersion ?? null,
        storageKey: stored.storageKey,
        sha256: stored.sha256,
        signedAt: new Date(),
      },
    });
  }

  // Update status + mark consents true (since we've completed signing ceremony)
  await prisma.case.update({
    where: { id: c.id },
    data: {
      status: 'SIGNED',
      consentInfoShare: true,
      consentInsurerContact: true,
      offeredUsualPharmacy: true,
      consentKevinBoivinExec: true,
    },
  });

  await prisma.auditEvent.create({
    data: {
      orgId: session.orgId,
      userId: session.userId,
      action: 'CASE_SIGNED',
      entityType: 'Case',
      entityId: c.id,
      metaJson: JSON.stringify({ envelopeId: envelope.id, providerEnvelopeId: envelope.providerEnvelopeId }),
    },
  });

  return { ok: true };
}

export async function markFaxed(caseId: string) {
  const { session, c } = await getCaseForSessionOrThrow(caseId);

  await prisma.case.update({
    where: { id: c.id },
    data: { status: 'FAXED' },
  });

  await prisma.auditEvent.create({
    data: {
      orgId: session.orgId,
      userId: session.userId,
      action: 'CASE_FAXED',
      entityType: 'Case',
      entityId: c.id,
      metaJson: JSON.stringify({ note: 'Manual fax (Eye-Q/NOW) marked by user' }),
    },
  });

  return { ok: true };
}
