import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function GET(req: Request) {
  const proto = req.headers.get('x-forwarded-proto') || 'http';
  const host = req.headers.get('x-forwarded-host') || req.headers.get('host') || new URL(req.url).host;
  const origin = `${proto}://${host}`;
  const defaultRedirect = `${origin}/api/mercado-pago/oauth/callback`;
  const redirectUri =
    process.env.OAUTH_REDIRECT_URI ||
    process.env.OATH_REDIRECT_URI ||
    defaultRedirect;

  const clientId =
    process.env.OAUTH_CLIENT_ID ||
    process.env.OATH_CLIENT_ID ||
    process.env.MP_CLIENT_ID ||
    process.env.MERCADOPAGO_CLIENT_ID ||
    '';
  if (!clientId) {
    return NextResponse.json({ error: 'Missing OAuth client id' }, { status: 500 });
  }

  const state = Math.random().toString(36).slice(2);
  const pkceEnabled = String(process.env.OAUTH_PKCE_ENABLED || 'true').toLowerCase() !== 'false';
  const codeMethod = (process.env.OAUTH_CODE_METHOD || 'S256').toUpperCase();
  const verifier = crypto.randomBytes(64).toString('base64url');
  const challenge = codeMethod === 'PLAIN'
    ? verifier
    : crypto.createHash('sha256').update(verifier).digest('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const url = new URL('https://auth.mercadopago.com/authorization');
  url.searchParams.set('client_id', clientId);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('redirect_uri', redirectUri);
  url.searchParams.set('state', state);
  if (pkceEnabled) {
    url.searchParams.set('code_challenge', challenge);
    url.searchParams.set('code_challenge_method', codeMethod);
  }
  url.searchParams.set('scope', 'offline_access');
  const resp = NextResponse.redirect(url.toString(), { status: 302 });
  if (pkceEnabled) {
    resp.cookies.set('mp_pkce_verifier', verifier, { httpOnly: true, sameSite: 'lax', path: '/' });
  }
  resp.cookies.set('mp_oauth_state', state, { httpOnly: true, sameSite: 'lax', path: '/' });
  return resp;
}
