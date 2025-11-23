import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const returnedState = url.searchParams.get('state');
    if (!code) {
      return NextResponse.json({ error: 'Missing code' }, { status: 400 });
    }
    const proto = req.headers.get('x-forwarded-proto') || 'http';
    const host = req.headers.get('x-forwarded-host') || req.headers.get('host') || url.host;
    const origin = `${proto}://${host}`;
    const redirectUri = `${origin}/api/mercado-pago/oauth/callback`;

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
      return NextResponse.json({ error: 'Missing OAuth client credentials' }, { status: 500 });
    }

    const cookies = req.headers.get('cookie') || '';
    const verifier = (cookies.match(/mp_pkce_verifier=([^;]+)/)?.[1]) || '';
    const storedState = (cookies.match(/mp_oauth_state=([^;]+)/)?.[1]) || '';
    if (!storedState || storedState !== returnedState) {
      return NextResponse.json({ error: 'Invalid OAuth state' }, { status: 400 });
    }
    const tokenRes = await fetch('https://api.mercadopago.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, code, redirect_uri: redirectUri, grant_type: 'authorization_code', ...(verifier ? { code_verifier: verifier } : {}) }),
    });
    const data = await tokenRes.json();
    if (!tokenRes.ok) {
      return NextResponse.json({ error: data }, { status: tokenRes.status });
    }

    const resp = NextResponse.redirect(`${origin}/services?connected=1`);
    resp.cookies.set('mp_connected', 'true', { httpOnly: true, sameSite: 'lax', path: '/' });
    if (data?.access_token) resp.cookies.set('mp_oauth_token', String(data.access_token), { httpOnly: true, sameSite: 'lax', path: '/' });
    if (data?.refresh_token) resp.cookies.set('mp_oauth_refresh', String(data.refresh_token), { httpOnly: true, sameSite: 'lax', path: '/' });
    resp.cookies.set('mp_pkce_verifier', '', { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 0 });
    resp.cookies.set('mp_oauth_state', '', { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 0 });
    return resp;
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unexpected error' }, { status: 500 });
  }
}
