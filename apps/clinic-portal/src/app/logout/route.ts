import { destroySessionCookie } from '@/server/auth/session';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  await destroySessionCookie();
  return NextResponse.redirect(new URL('/login', request.url));
}
