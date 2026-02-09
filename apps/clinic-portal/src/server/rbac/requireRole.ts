import { redirect } from 'next/navigation';
import { getSession } from '@/server/auth/session';

// Minimal RBAC helper for server components / actions.
export async function requireRole(allowed: string[]) {
  const session = await getSession();
  if (!session) redirect('/login');

  if (!allowed.includes(session.role)) {
    // In production you might show a 403 page.
    redirect('/unauthorized');
  }

  return session;
}
