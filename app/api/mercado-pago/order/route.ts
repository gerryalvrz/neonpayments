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

    const { amount, payerEmail, processingMode = 'automatic', externalReference, providerId, accountNumber, phoneNumber, payerFirstName, payerLastName } = await req.json();
    const extRef = externalReference || `service_${providerId || 'unknown'}_${Date.now()}`;
    const idemKey = extRef || `order_${Date.now()}_${Math.random().toString(36).slice(2,8)}`;
    const amt = Number(amount);
    if (!amt || amt < 50) {
      return NextResponse.json(
        { error: { code: 'unprocessable_entity', message: 'Minimum amount for bank transfer is 50 MXN' } },
        { status: 422 }
      );
    }
    const inferredFirst = payerFirstName || (payerEmail ? String(payerEmail).split('@')[0] : '');
    const inferredLast = payerLastName || '';

    const body = {
      type: 'online',
      processing_mode: processingMode,
      total_amount: String(amt),
      external_reference: extRef,
      payer: {
        email: String(payerEmail || ''),
        first_name: inferredFirst,
        last_name: inferredLast,
        entity_type: 'individual',
      },
      transactions: {
        payments: [
          {
            amount: String(amt),
            payment_method: {
              id: 'clabe',
              type: 'bank_transfer',
            },
          },
        ],
      },
    };

    const res = await fetch('https://api.mercadopago.com/v1/orders', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': idemKey,
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json({ error: data }, { status: res.status });
    }

    let paymentDetails: any = null;
    const paymentId = data?.transactions?.payments?.[0]?.id;
    if (paymentId) {
      const pRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });
      if (pRes.ok) {
        paymentDetails = await pRes.json();
      }
    }

    return NextResponse.json({ order: data, payment_details: paymentDetails, service: { providerId, accountNumber, phoneNumber } }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unexpected error' }, { status: 500 });
  }
}
