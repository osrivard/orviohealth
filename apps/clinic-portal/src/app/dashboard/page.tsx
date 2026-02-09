import { prisma } from '@/server/db/prisma';
import { requireRole } from '@/server/rbac/requireRole';

export default async function PatientsPage() {
  await requireRole(['CLINIC_ADMIN','CLINIC_STAFF','PHARMACY_ADMIN','PHARMACY_STAFF']);

  const patients = await prisma.patient.findMany({
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  return (
    <div className="grid">
      <div className="card">
        <div className="header" style={{ marginBottom: 0 }}>
          <h2 style={{ margin: 0 }}>Patients</h2>
          <a href="/dashboard/patients/new">
            <button type="button">+ Nouveau patient</button>
          </a>
        </div>
      </div>

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Nom</th>
              <th>Date de naissance</th>
              <th>RAMQ</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {patients.map((p) => (
              <tr key={p.id}>
                <td>{p.lastName}, {p.firstName}</td>
                <td>{p.dob.toISOString().slice(0,10)}</td>
                <td>{p.ramqNumber ?? '-'}</td>
                <td><a href={`/dashboard/patients/${p.id}`}>Ouvrir</a></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
