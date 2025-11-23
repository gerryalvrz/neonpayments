import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const accessToken = process.env.MERCADOLIBER_ACCESS_TOKEN || '';
    if (!accessToken) {
      return NextResponse.json({ error: 'Missing access token (server env not set)' }, { status: 500 });
    }

    const proto = req.headers.get('x-forwarded-proto') || 'http';
    const host = req.headers.get('x-forwarded-host') || req.headers.get('host') || new URL(req.url).host;
    const origin = `${proto}://${host}`;
    const body = await req.json();
    const amount = Number(body?.amount || 0);
    const title = String(body?.title || body?.description || 'Service payment');
    const externalReference = String(body?.externalReference || `svc_${Date.now()}`);
    if (!amount || amount < 1) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    }

    const preferencePayload = {
      items: [
        {
          title,
          quantity: 1,
          currency_id: 'MXN',
          unit_price: amount,
        },
      ],
      external_reference: externalReference,
      back_urls: {
        success: `${origin}/mercado-pago`,
        failure: `${origin}/mercado-pago`,
        pending: `${origin}/mercado-pago`,
      },
      notification_url: `${origin}/api/mercado-pago/webhook`,
    };

    const prefRes = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(preferencePayload),
    });
    const prefData = await prefRes.json();
    if (!prefRes.ok) {
      return NextResponse.json({ error: prefData }, { status: prefRes.status });
    }

    return NextResponse.json({ init_point: prefData.init_point, sandbox_init_point: prefData.sandbox_init_point, preference_id: prefData.id }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unexpected error' }, { status: 500 });
  }
}
