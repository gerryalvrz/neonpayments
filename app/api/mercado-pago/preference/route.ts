import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const envAccess =
      process.env.MERCADOPAGO_ACCESS_TOKEN ||
      process.env.MERCADOLIBRE_ACCESS_TOKEN ||
      process.env.MERCADOLIBER_ACCESS_TOKEN ||
      process.env.MERCADO_PAGO_ACCESS_TOKEN ||
      process.env.MP_ACCESS_TOKEN ||
      '';
    const accessToken = envAccess;
    if (!accessToken) {
      return NextResponse.json({ error: 'Missing access token (server env not set)' }, { status: 500 });
    }

    const bodyReq = await req.json();
    const {
      amount,
      description = 'Service payment',
      externalReference,
      payerEmail,
    } = bodyReq;

    const amt = Number(amount);
    if (!amt || amt < 10) {
      return NextResponse.json(
        { error: { code: 'unprocessable_entity', message: 'Minimum amount is 10 MXN' } },
        { status: 422 }
      );
    }

    const proto = req.headers.get('x-forwarded-proto') || 'http';
    const host = req.headers.get('x-forwarded-host') || req.headers.get('host') || new URL(req.url).host;
    const origin = `${proto}://${host}`;

    const prefPayload = {
      items: [
        {
          title: description,
          quantity: 1,
          unit_price: amt,
          currency_id: 'MXN',
        },
      ],
      payer: payerEmail ? { email: String(payerEmail) } : undefined,
      external_reference: externalReference || `svc_${Date.now()}`,
      payment_methods: {
        default_payment_method_id: 'spei',
      },
      notification_url: `${origin}/api/mercado-pago/webhook`,
    } as any;

    const res = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(prefPayload),
    });

    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json({ error: data }, { status: res.status });
    }

    return NextResponse.json({ preference: data }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unexpected error' }, { status: 500 });
  }
}
