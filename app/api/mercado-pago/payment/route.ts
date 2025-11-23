import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  try {
    const cookieAccess = cookies().get('mp_access_token')?.value;
    const envAccess =
      process.env.MERCADOPAGO_ACCESS_TOKEN ||
      process.env.MERCADOLIBRE_ACCESS_TOKEN ||
      process.env.MERCADO_PAGO_ACCESS_TOKEN ||
      process.env.MP_ACCESS_TOKEN ||
      '';
    const accessToken = cookieAccess || envAccess;
    if (!accessToken) {
      return NextResponse.json({ error: 'Missing access token (server env not set)' }, { status: 500 });
    }

    const bodyReq = await req.json();
    const {
      amount,
      payerEmail,
      description = 'Service payment',
      externalReference,
    } = bodyReq;

    const idemKey = externalReference || `payment_${Date.now()}_${Math.random().toString(36).slice(2,8)}`;

    const amt = Number(amount);
    if (!amt || amt < 50) {
      return NextResponse.json(
        { error: { code: 'unprocessable_entity', message: 'Minimum amount for bank transfer is 50 MXN' } },
        { status: 422 }
      );
    }

    const payload = {
      transaction_amount: amt,
      description,
      payment_method_id: 'clabe',
      payer: {
        email: String(payerEmail || ''),
        entity_type: 'individual',
      },
      external_reference: externalReference || `svc_${Date.now()}`,
    };

    const res = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': idemKey,
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json({ error: data }, { status: res.status });
    }

    return NextResponse.json(data, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unexpected error' }, { status: 500 });
  }
}
