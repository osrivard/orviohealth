import { prisma } from '@/server/db/prisma';
import { requireRole } from '@/server/rbac/requireRole';
import { redirect } from 'next/navigation';

async function createPatientAction(formData: FormData) {
  'use server';
  await requireRole(['CLINIC_ADMIN','CLINIC_STAFF','PHARMACY_ADMIN','PHARMACY_STAFF']);

  const firstName = String(formData.get('firstName') || '').trim();
  const lastName = String(formData.get('lastName') || '').trim();
  const dob = String(formData.get('dob') || '').trim();
  const ramqNumber = String(formData.get('ramqNumber') || '').trim();

  if (!firstName || !lastName || !dob) return;

  const patient = await prisma.patient.create({
    data: {
      firstName,
      lastName,
      dob: new Date(dob),
      ramqNumber: ramqNumber || null,
      preferredLanguage: 'FR',
    },
  });

  redirect(`/dashboard/patients/${patient.id}`);
}

export default async function NewPatientPage() {
  await requireRole(['CLINIC_ADMIN','CLINIC_STAFF','PHARMACY_ADMIN','PHARMACY_STAFF']);

  return (
    <div className="card" style={{ maxWidth: 720 }}>
      <h2 style={{ marginTop: 0 }}>Nouveau patient</h2>

      <form action={createPatientAction} className="grid">
        <div className="grid grid2">
          <div>
            <label>Prénom</label>
            <input name="firstName" />
          </div>
          <div>
            <label>Nom</label>
            <input name="lastName" />
          </div>
        </div>

        <div className="grid grid2">
          <div>
            <label>Date de naissance</label>
            <input name="dob" type="date" />
          </div>
          <div>
            <label>RAMQ (optionnel)</label>
            <input name="ramqNumber" placeholder="ABCD 1234 5678" />
          </div>
        </div>

        <button type="submit">Créer</button>
      </form>
    </div>
  );
}
