import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';
import { z } from 'zod';

// Session payload stored in an HTTP-only cookie.
// Keep it small: just who the user is + active org + role.
export const SessionSchema = z.object({
  userId: z.string().uuid(),
  orgId: z.string().uuid(),
  role: z.string(), // Role enum string (kept as string to avoid import cycles)
  email: z.string().email(),
  name: z.string().optional(),
});

export type Session = z.infer<typeof SessionSchema>;

const COOKIE_NAME = 'orvio_session';

function getSecretKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('AUTH_SECRET must be set (32+ chars).');
  }
  return new TextEncoder().encode(secret);
}

export async function createSessionCookie(session: Session) {
  const token = await new SignJWT(session)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(getSecretKey());

  cookies().set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  });
}

export async function destroySessionCookie() {
  cookies().set(COOKIE_NAME, '', { httpOnly: true, path: '/', maxAge: 0 });
}

export async function getSession(): Promise<Session | null> {
  const token = cookies().get(COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    const parsed = SessionSchema.safeParse(payload);
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}
