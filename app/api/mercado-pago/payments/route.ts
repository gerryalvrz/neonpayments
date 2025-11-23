import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const accessToken = process.env.MERCADOLIBER_ACCESS_TOKEN || '';
    const tokenToUse = accessToken;
    const tokenSource = 'env';
    if (!tokenToUse) {
      return NextResponse.json({ error: 'Missing access token (server env not set)' }, { status: 500 });
    }
    const amount = Number(body?.amount || body?.transaction_amount || 0);
    if (!amount || amount < 1) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    }

    const method = String(body?.payment_method_id || '').trim().toLowerCase() || 'clabe';
    const ua = (req.headers.get('user-agent') || '').toLowerCase();
    const defaultEmail = (String(body?.payer?.email || body?.payerEmail || '').trim() || 'default@gmail.com');
    let paymentPayload: any;
    const requestId = `mp_${Date.now()}`;
    console.log('[mp.payments:req]', {
      requestId,
      ua,
      tokenSource,
      method,
      amount,
      hasPayerEmail: !!(body?.payer?.email || body?.payerEmail),
      externalReference: body?.externalReference,
    });

    if (method === 'clabe') {
      paymentPayload = {
        transaction_amount: amount,
        description: body?.description || 'Service payment',
        payment_method_id: 'clabe',
        external_reference: body?.externalReference || `svc_${Date.now()}`,
        transaction_details: {
          financial_institution: '1',
        },
        payer: {
          email: defaultEmail,
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

    console.log('[mp.payments:payload]', {
      requestId,
      url: 'https://api.mercadopago.com/v1/payments',
      headers: {
        'Content-Type': 'application/json',
        'X-Idempotency-Key': String(body?.idempotencyKey || body?.externalReference || `spei_${Date.now()}`),
        Authorization: '[redacted]'
      },
      body: paymentPayload,
      tokenSource,
      ua,
    });

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
      console.error('[mp.payments:err]', {
        requestId,
        status: res.status,
        message: data?.message || data?.error,
        cause: data?.cause,
        response: data,
      });
      const msg = (data?.message || data?.error || '').toString().toLowerCase();
      if (res.status === 401 && msg.includes('unauthorized')) {
        return NextResponse.json(
          { error: 'Mercado Pago returned 401 (use TEST access token in dev). Set MERCADOPAGO_TEST_ACCESS_TOKEN or MERCADOLIBER_TEST_ACCESS_TOKEN.' },
          { status: 401 }
        );
      }
      return NextResponse.json({ error: data }, { status: res.status });
    }

    console.info('[mp.payments:ok]', { requestId, status: res.status, id: data?.id || data?.payment?.id, response: data });
    return NextResponse.json({ payment: data }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unexpected error' }, { status: 500 });
  }
}
