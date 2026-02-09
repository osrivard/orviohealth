import { requireRole } from '@/server/rbac/requireRole';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await requireRole(['CLINIC_ADMIN','CLINIC_STAFF','PHARMACY_ADMIN','PHARMACY_STAFF']);

  return (
    <div className="container">
      <div className="header">
        <div>
          <div style={{ fontWeight: 700 }}>Orvio Clinic Portal</div>
          <div style={{ color: '#6b7280', fontSize: 12 }}>
            {session.email} · <span className="badge">{session.role}</span>
          </div>
        </div>

        <form action="/logout" method="post">
          <button type="submit" className="secondary">Déconnexion</button>
        </form>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <a className="badge" href="/dashboard">Patients</a>
        <a className="badge" href="/dashboard/cases">Dossiers</a>
      </div>

      {children}
    </div>
  );
}
