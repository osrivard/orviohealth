import { prisma } from '@/server/db/prisma';
import bcrypt from 'bcryptjs';
import { createSessionCookie } from '@/server/auth/session';
import { redirect } from 'next/navigation';

async function loginAction(formData: FormData) {
  'use server';

  const email = String(formData.get('email') || '').trim().toLowerCase();
  const password = String(formData.get('password') || '');

  if (!email || !password) return;

  const user = await prisma.user.findUnique({
    where: { email },
    include: { memberships: true },
  });

  if (!user) return;

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return;

  const membership = user.memberships[0];
  if (!membership) return;

  await createSessionCookie({
    userId: user.id,
    orgId: membership.orgId,
    role: membership.role,
    email: user.email,
    name: user.name ?? undefined,
  });

  redirect('/dashboard');
}

export default function LoginPage() {
  return (
    <div className="container" style={{ maxWidth: 520 }}>
      <div className="card">
        <h1 style={{ marginTop: 0 }}>Connexion</h1>
        <p style={{ marginTop: 0, color: '#6b7280' }}>
          Portail clinique + pharmacie (aucun compte patient).
        </p>

        <form action={loginAction} className="grid" style={{ marginTop: 16 }}>
          <div>
            <label>Courriel</label>
            <input name="email" type="email" placeholder="vous@exemple.com" />
          </div>
          <div>
            <label>Mot de passe</label>
            <input name="password" type="password" placeholder="••••••••" />
          </div>
          <button type="submit">Se connecter</button>
        </form>

        <p style={{ color: '#6b7280', marginTop: 16, fontSize: 12 }}>
          TODO: ajouter MFA + verrouillage de session pour usage kiosque.
        </p>
      </div>
    </div>
  );
}
