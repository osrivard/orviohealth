import { prisma } from '@/server/db/prisma';
import { requireRole } from '@/server/rbac/requireRole';
import { notFound } from 'next/navigation';

export default async function PatientDetail({ params }: { params: { patientId: string } }) {
  await requireRole(['CLINIC_ADMIN','CLINIC_STAFF','PHARMACY_ADMIN','PHARMACY_STAFF']);

  const patient = await prisma.patient.findUnique({
    where: { id: params.patientId },
    include: { cases: { orderBy: { createdAt: 'desc' }, include: { documents: true } } },
  });

  if (!patient) return notFound();

  return (
    <div className="grid">
      <div className="card">
        <div className="header" style={{ marginBottom: 0 }}>
          <div>
            <h2 style={{ margin: 0 }}>{patient.lastName}, {patient.firstName}</h2>
            <div style={{ color: '#6b7280', fontSize: 12 }}>
              DOB {patient.dob.toISOString().slice(0,10)} · RAMQ {patient.ramqNumber ?? '-'}
            </div>
          </div>

          <a href={`/dashboard/patients/${patient.id}/cases/new`}>
            <button type="button">+ Nouveau dossier</button>
          </a>
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Dossiers</h3>
        {patient.cases.length === 0 ? (
          <p style={{ color: '#6b7280' }}>Aucun dossier pour ce patient.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Créé</th>
                <th>Dx</th>
                <th>Médicament</th>
                <th>Oeil</th>
                <th>Statut</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {patient.cases.map((c) => (
                <tr key={c.id}>
                  <td>{c.createdAt.toISOString().slice(0,10)}</td>
                  <td>{c.diagnosis}</td>
                  <td>{c.medication}</td>
                  <td>{c.eye}</td>
                  <td><span className="badge">{c.status}</span></td>
                  <td><a href={`/dashboard/cases/${c.id}`}>Ouvrir</a></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
