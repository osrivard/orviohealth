import { prisma } from '@/server/db/prisma';
import { requireRole } from '@/server/rbac/requireRole';

export default async function CasesPage() {
  const session = await requireRole(['CLINIC_ADMIN','CLINIC_STAFF','PHARMACY_ADMIN','PHARMACY_STAFF']);

  // Scope:
  // - clinic users see cases for their clinic org
  // - pharmacy users see cases assigned to their pharmacy org
  const where = session.role.startsWith('CLINIC')
    ? { clinicOrgId: session.orgId }
    : { pharmacyOrgId: session.orgId };

  const cases = await prisma.case.findMany({
    where,
    include: { patient: true },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  return (
    <div className="card">
      <h2 style={{ marginTop: 0 }}>Dossiers</h2>

      <table className="table">
        <thead>
          <tr>
            <th>Patient</th>
            <th>Créé</th>
            <th>Dx</th>
            <th>Médicament</th>
            <th>Oeil</th>
            <th>Statut</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {cases.map((c) => (
            <tr key={c.id}>
              <td>{c.patient.lastName}, {c.patient.firstName}</td>
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
    </div>
  );
}
