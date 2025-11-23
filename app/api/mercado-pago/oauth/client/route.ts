import { NextResponse } from 'next/server';

export async function POST() {
  try {
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
    if (!clientId || !clientSecret) {
      return NextResponse.json({ error: 'Missing client credentials' }, { status: 500 });
    }
    const tokenRes = await fetch('https://api.mercadopago.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, grant_type: 'client_credentials' }),
    });
    const data = await tokenRes.json();
    if (!tokenRes.ok) {
      return NextResponse.json({ error: data }, { status: tokenRes.status });
    }
    const resp = NextResponse.json({ ok: true });
    if (data?.access_token) resp.cookies.set('mp_oauth_token', String(data.access_token), { httpOnly: true, sameSite: 'lax', path: '/' });
    resp.cookies.set('mp_connected', 'true', { httpOnly: true, sameSite: 'lax', path: '/' });
    return resp;
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unexpected error' }, { status: 500 });
  }
}

