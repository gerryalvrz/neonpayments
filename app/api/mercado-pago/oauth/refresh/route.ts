import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const cookies = req.headers.get('cookie') || '';
    const refresh = (cookies.match(/mp_oauth_refresh=([^;]+)/)?.[1]) || '';
    const clientId =
      process.env.OAUTH_CLIENT_ID ||
      process.env.OATH_CLIENT_ID ||
      process.env.MP_CLIENT_ID ||
      process.env.MERCADOPAGO_CLIENT_ID ||
      '';
    const clientSecret =
      process.env.OAUTH_CLIENT_SECRET ||
      process.env.OATH_CLIENT_SECRET ||
      process.env.MP_CLIENT_SECRET ||
      process.env.MERCADOPAGO_CLIENT_SECRET ||
      '';
    if (!clientId || !clientSecret || !refresh) {
      return NextResponse.json({ error: 'Missing refresh prerequisites' }, { status: 400 });
    }
    const tokenRes = await fetch('https://api.mercadopago.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, grant_type: 'refresh_token', refresh_token: refresh }),
    });
    const data = await tokenRes.json();
    if (!tokenRes.ok) {
      return NextResponse.json({ error: data }, { status: tokenRes.status });
    }
    const resp = NextResponse.json({ ok: true });
    if (data?.access_token) resp.cookies.set('mp_oauth_token', String(data.access_token), { httpOnly: true, sameSite: 'lax', path: '/' });
    if (data?.refresh_token) resp.cookies.set('mp_oauth_refresh', String(data.refresh_token), { httpOnly: true, sameSite: 'lax', path: '/' });
    return resp;
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unexpected error' }, { status: 500 });
  }
}

