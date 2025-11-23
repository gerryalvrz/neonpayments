import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const cookie = req.headers.get('cookie') || '';
  const connected = /mp_connected=true/.test(cookie);
  const token = (cookie.match(/mp_oauth_token=([^;]+)/)?.[1]) || '';
  return NextResponse.json({ connected, hasToken: !!token });
}

