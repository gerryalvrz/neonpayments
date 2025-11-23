import { NextResponse } from 'next/server';

export async function POST() {
  const resp = NextResponse.json({ ok: true });
  resp.cookies.set('mp_connected', '', { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 0 });
  resp.cookies.set('mp_oauth_token', '', { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 0 });
  resp.cookies.set('mp_oauth_refresh', '', { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 0 });
  return resp;
}

