import { prisma } from '@/server/db/prisma';
import { requireRole } from '@/server/rbac/requireRole';
import { startSigning, markFaxed } from '@/server/packages/caseActions';
import { notFound, redirect } from 'next/navigation';

async function startSigningAction(caseId: string) {
  'use server';
  await startSigning(caseId);
  redirect(`/dashboard/cases/${caseId}`);
}

async function markFaxedAction(caseId: string) {
  'use server';
  await markFaxed(caseId);
  redirect(`/dashboard/cases/${caseId}`);
}

export default async function CaseDetail({ params }: { params: { caseId: string } }) {
  const session = await requireRole(['CLINIC_ADMIN','CLINIC_STAFF','PHARMACY_ADMIN','PHARMACY_STAFF']);

  const c = await prisma.case.findUnique({
    where: { id: params.caseId },
    include: { patient: true, documents: { orderBy: { createdAt: 'desc' } }, envelope: true },
  });

  if (!c) return notFound();

  // Scope enforcement: clinic users see clinic cases; pharmacy users see pharmacy-assigned cases.
  const allowed = session.role.startsWith('CLINIC')
    ? c.clinicOrgId === session.orgId
    : c.pharmacyOrgId === session.orgId;

  if (!allowed) redirect('/unauthorized');

  const eyeqnowDoc = c.documents.find((d) => d.type === 'EYEQNOW_ENROLLMENT');

  return (
    <div className="grid">
      <div className="card">
        <div className="header" style={{ marginBottom: 0 }}>
          <div>
            <h2 style={{ margin: 0 }}>Dossier</h2>
            <div style={{ color: '#6b7280', fontSize: 12 }}>
              {c.patient.lastName}, {c.patient.firstName} · {c.language} · <span className="badge">{c.status}</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <form action={startSigningAction.bind(null, c.id)}>
              <button type="submit">{c.status === 'SIGNED' || c.status === 'FAXED' ? 'Re-signer' : 'Démarrer signature'}</button>
            </form>
            <form action={markFaxedAction.bind(null, c.id)}>
              <button type="submit" className="secondary">Marquer comme faxé</button>
            </form>
          </div>
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Données structurées</h3>
        <div className="grid grid2">
          <div><strong>Dx:</strong> {c.diagnosis}{c.diagnosisOther ? ` (${c.diagnosisOther})` : ''}</div>
          <div><strong>Médicament:</strong> {c.medication}</div>
          <div><strong>Oeil:</strong> {c.eye}</div>
          <div><strong>Doses:</strong> {c.injectionDoses ?? '-'}</div>
        </div>

        <hr style={{ border: 0, borderTop: '1px solid #e5e7eb', margin: '16px 0' }} />

        <div className="grid grid2">
          <div><strong>Assurance:</strong> {[
            c.insurancePublic && 'Publique',
            c.insurancePrivate && 'Privée',
            c.insuranceSelfPay && 'Auto-payeur'
          ].filter(Boolean).join(', ') || '-'}</div>

          <div><strong>Peut laisser message:</strong> {c.canLeaveMessage === null ? '-' : c.canLeaveMessage ? 'Oui' : 'Non'}</div>
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Documents</h3>

        <p style={{ color: '#6b7280', marginTop: 0 }}>
          Pour l'instant, le provider est <code>mock</code> et stocke les documents de référence. Quand DocuSign sera configuré,
          cette section contiendra les PDFs signés.
        </p>

        {c.documents.length === 0 ? (
          <p style={{ color: '#6b7280' }}>Aucun document stocké pour ce dossier.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Créé</th>
                <th>Version</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {c.documents.map((d) => (
                <tr key={d.id}>
                  <td>{d.type}</td>
                  <td>{d.createdAt.toISOString().slice(0,19).replace('T',' ')}</td>
                  <td>{d.templateVersion ?? '-'}</td>
                  <td><a href={`/dashboard/documents/${d.id}/download`}>Télécharger</a></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <div style={{ marginTop: 16 }}>
          <strong>Fax manuel:</strong>{' '}
          {eyeqnowDoc ? (
            <a href={`/dashboard/documents/${eyeqnowDoc.id}/download`}>Télécharger Eye-Q/NOW (pour fax)</a>
          ) : (
            <span style={{ color: '#6b7280' }}>Eye-Q/NOW n'est pas encore généré.</span>
          )}
        </div>
      </div>
    </div>
  );
}
