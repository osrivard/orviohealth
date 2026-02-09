import { prisma } from '@/server/db/prisma';
import { requireRole } from '@/server/rbac/requireRole';
import { redirect } from 'next/navigation';

async function createCaseAction(patientId: string, formData: FormData) {
  'use server';
  const session = await requireRole(['CLINIC_ADMIN','CLINIC_STAFF','PHARMACY_ADMIN','PHARMACY_STAFF']);

  // For the MVP, we default to:
  // - clinicOrgId: first clinic org in DB OR the current org if clinic user
  // - pharmacyOrgId: Kevin Boivin org OR current org if pharmacy user
  const clinic = session.role.startsWith('CLINIC')
    ? { id: session.orgId }
    : await prisma.organization.findFirst({ where: { type: 'CLINIC' }, select: { id: true } });

  const pharmacy = session.role.startsWith('PHARMACY')
    ? { id: session.orgId }
    : await prisma.organization.findFirst({ where: { type: 'PHARMACY' }, select: { id: true } });

  if (!clinic || !pharmacy) throw new Error('Missing clinic/pharmacy org in DB.');

  const diagnosis = String(formData.get('diagnosis') || 'DMLA');
  const diagnosisOther = String(formData.get('diagnosisOther') || '').trim();
  const medication = String(formData.get('medication') || 'EYLEA_PFS_2MG');
  const eye = String(formData.get('eye') || 'OD');

  const insurancePublic = formData.get('insurancePublic') === 'on';
  const insurancePrivate = formData.get('insurancePrivate') === 'on';
  const insuranceSelfPay = formData.get('insuranceSelfPay') === 'on';

  const c = await prisma.case.create({
    data: {
      patientId,
      clinicOrgId: clinic.id,
      pharmacyOrgId: pharmacy.id,
      language: 'FR',
      diagnosis: diagnosis as any,
      diagnosisOther: diagnosisOther || null,
      medication: medication as any,
      eye: eye as any,
      injectionDoses: Number(formData.get('injectionDoses') || '') || null,

      insurancePublic,
      insurancePrivate,
      insuranceSelfPay,
      privateInsurer: String(formData.get('privateInsurer') || '').trim() || null,
      privateGroup: String(formData.get('privateGroup') || '').trim() || null,
      privateCert: String(formData.get('privateCert') || '').trim() || null,

      bestTimeMorning: formData.get('bestTimeMorning') === 'on',
      bestTimeAfternoon: formData.get('bestTimeAfternoon') === 'on',
      bestTimeEvening: formData.get('bestTimeEvening') === 'on',
      canLeaveMessage: formData.get('canLeaveMessage') ? formData.get('canLeaveMessage') === 'yes' : null,

      preferEmail: formData.get('preferEmail') === 'on',
      preferPhone: formData.get('preferPhone') === 'on',
      preferCell: formData.get('preferCell') === 'on',

      // Consent fields are typically captured during signing; keep defaults false.
      // We'll set them true automatically when we store completed signed documents.
    },
  });

  redirect(`/dashboard/cases/${c.id}`);
}

export default async function NewCasePage({ params }: { params: { patientId: string } }) {
  await requireRole(['CLINIC_ADMIN','CLINIC_STAFF','PHARMACY_ADMIN','PHARMACY_STAFF']);

  return (
    <div className="card" style={{ maxWidth: 900 }}>
      <h2 style={{ marginTop: 0 }}>Nouveau dossier</h2>
      <p style={{ color: '#6b7280', marginTop: 0 }}>
        Dossier = un "bundle" (Eye-Q/NOW + consent pharmacie + prescription) attaché au même enregistrement.
      </p>

      <form action={createCaseAction.bind(null, params.patientId)} className="grid">
        <div className="grid grid2">
          <div>
            <label>Diagnostic</label>
            <select name="diagnosis" defaultValue="DMLA">
              <option value="DMLA">DMLA</option>
              <option value="OMD">OMD</option>
              <option value="OVCR">OVCR</option>
              <option value="OBVR">OBVR</option>
              <option value="MCNV">MCNV</option>
              <option value="NVC_MYOPIQUE">NVC myopique</option>
              <option value="AUTRE">Autre</option>
            </select>
          </div>
          <div>
            <label>Si "Autre" (optionnel)</label>
            <input name="diagnosisOther" />
          </div>
        </div>

        <div className="grid grid2">
          <div>
            <label>Médicament</label>
            <select name="medication" defaultValue="EYLEA_PFS_2MG">
              <option value="EYLEA_PFS_2MG">EYLEA PFS 2mg</option>
              <option value="LUCENTIS_05MG">LUCENTIS 0.5mg</option>
              <option value="OZURDEX_07MG">OZURDEX 0.7mg</option>
              <option value="BEOVU_6MG">BEOVU 6mg</option>
              <option value="VABYSMO_6MG">VABYSMO 6mg</option>
            </select>
          </div>
          <div>
            <label>Oeil</label>
            <select name="eye" defaultValue="OD">
              <option value="OD">OD (droit)</option>
              <option value="OG">OG (gauche)</option>
              <option value="OU">OU (les deux)</option>
            </select>
          </div>
        </div>

        <div className="grid grid2">
          <div>
            <label>Nombre de doses (optionnel)</label>
            <select name="injectionDoses" defaultValue="">
              <option value="">—</option>
              <option value="1">1</option>
              <option value="2">2</option>
            </select>
          </div>
          <div />
        </div>

        <div className="card" style={{ background: '#fafafa' }}>
          <h3 style={{ marginTop: 0 }}>Assurance</h3>
          <div className="grid grid2">
            <label><input type="checkbox" name="insurancePublic" /> Publique (RAMQ)</label>
            <label><input type="checkbox" name="insurancePrivate" /> Privée</label>
          </div>
          <label><input type="checkbox" name="insuranceSelfPay" /> Auto-payeur</label>

          <div className="grid grid2" style={{ marginTop: 12 }}>
            <div>
              <label>Assureur (privé)</label>
              <input name="privateInsurer" />
            </div>
            <div>
              <label>Groupe</label>
              <input name="privateGroup" />
            </div>
          </div>
          <div style={{ marginTop: 12 }}>
            <label>Certificat</label>
            <input name="privateCert" />
          </div>
        </div>

        <div className="card" style={{ background: '#fafafa' }}>
          <h3 style={{ marginTop: 0 }}>Préférences de contact (Eye-Q/NOW)</h3>
          <div className="grid grid2">
            <label><input type="checkbox" name="preferEmail" /> Courriel</label>
            <label><input type="checkbox" name="preferPhone" /> Téléphone</label>
          </div>
          <label><input type="checkbox" name="preferCell" /> Cellulaire</label>

          <div style={{ marginTop: 12 }}>
            <div style={{ fontWeight: 600, marginBottom: 6 }}>Meilleur moment</div>
            <div className="grid grid2">
              <label><input type="checkbox" name="bestTimeMorning" /> Matin</label>
              <label><input type="checkbox" name="bestTimeAfternoon" /> Après-midi</label>
            </div>
            <label><input type="checkbox" name="bestTimeEvening" /> Soir</label>
          </div>

          <div style={{ marginTop: 12 }}>
            <label>Peut-on laisser un message?</label>
            <select name="canLeaveMessage" defaultValue="">
              <option value="">—</option>
              <option value="yes">Oui</option>
              <option value="no">Non</option>
            </select>
          </div>
        </div>

        <button type="submit">Créer le dossier</button>
      </form>

      <p style={{ color: '#6b7280', fontSize: 12 }}>
        TODO: rendre la pharmacie sélectionnable via config "packages" quand vous ajouterez d'autres pharmacies.
      </p>
    </div>
  );
}
