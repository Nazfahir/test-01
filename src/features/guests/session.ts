import { cookies } from 'next/headers';
import { randomUUID } from 'crypto';

const GUEST_SESSION_COOKIE = 'orbitas_guest_session_id';

export const guestSessionCookieName = GUEST_SESSION_COOKIE;

export async function getGuestSessionIdFromCookie(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(GUEST_SESSION_COOKIE)?.value ?? null;
}

export async function ensureGuestSessionCookie(sessionId?: string): Promise<string> {
  const cookieStore = await cookies();
  const nextSessionId = sessionId ?? randomUUID();

  cookieStore.set(GUEST_SESSION_COOKIE, nextSessionId, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });

  return nextSessionId;
}
