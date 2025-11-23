import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const headerOverride = req.headers.get('x-mp-access-token') || '';
    const cookieHeader = req.headers.get('cookie') || '';
    const cookieToken = (cookieHeader.match(/mp_oauth_token=([^;]+)/)?.[1]) || '';
    const bodyOverride = typeof body?.accessToken === 'string' ? body.accessToken : '';
    const overrideToken = headerOverride || bodyOverride || '';

    const accessToken =
      process.env.MERCADOPAGO_TEST_ACCESS_TOKEN ||
      process.env.MERCADOLIBRE_TEST_ACCESS_TOKEN ||
      process.env.MERCADOLIBER_TEST_ACCESS_TOKEN ||
      process.env.MP_TEST_ACCESS_TOKEN ||
      process.env.MERCADOPAGO_ACCESS_TOKEN ||
      process.env.MERCADOLIBRE_ACCESS_TOKEN ||
      process.env.MERCADOLIBER_ACCESS_TOKEN ||
      process.env.MERCADO_PAGO_ACCESS_TOKEN ||
      process.env.MP_ACCESS_TOKEN ||
      '';
    const tokenToUse = overrideToken || cookieToken || accessToken;
    if (!tokenToUse) {
      return NextResponse.json({ error: 'Missing access token (server env not set)' }, { status: 500 });
    }
    const amount = Number(body?.amount || body?.transaction_amount || 0);
    if (!amount || amount < 1) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    }

    const method = String(body?.payment_method_id || '').trim().toLowerCase() || 'clabe';
    const defaultEmail = (String(body?.payer?.email || body?.payerEmail || '').trim() || 'default@gmail.com');
    let paymentPayload: any;

    if (method === 'clabe') {
      paymentPayload = {
        transaction_amount: amount,
        description: body?.description || 'Service payment',
        payment_method_id: 'clabe',
        external_reference: body?.externalReference || `svc_${Date.now()}`,
        payer: {
          email: defaultEmail,
        },
        transaction_details: {
          financial_institution: '1',
        },
      };
    } else {
      paymentPayload = {
        transaction_amount: amount,
        token: body?.token,
        description: body?.description || 'Service payment',
        installments: body?.installments || 1,
        payment_method_id: body?.payment_method_id,
        issuer_id: body?.issuer_id,
        external_reference: body?.externalReference || `svc_${Date.now()}`,
        payer: {
          email: defaultEmail,
          identification: body?.payer?.identification || undefined,
        },
      };
    }

    const idemKey = String(body?.idempotencyKey || body?.externalReference || `spei_${Date.now()}`);
    const res = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${tokenToUse}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': idemKey,
      },
      body: JSON.stringify(paymentPayload),
    });

    const data = await res.json();
    if (!res.ok) {
      const msg = (data?.message || data?.error || '').toString().toLowerCase();
      if (res.status === 401 && msg.includes('unauthorized')) {
        return NextResponse.json(
          { error: 'Mercado Pago returned 401 (use TEST access token in dev). Set MERCADOPAGO_TEST_ACCESS_TOKEN or MERCADOLIBER_TEST_ACCESS_TOKEN.' },
          { status: 401 }
        );
      }
      return NextResponse.json({ error: data }, { status: res.status });
    }

    return NextResponse.json({ payment: data }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unexpected error' }, { status: 500 });
  }
}
