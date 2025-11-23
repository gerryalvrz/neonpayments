'use server';

import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN || '';
    const url = new URL(req.url);
    const type = url.searchParams.get('type') || url.searchParams.get('topic') || '';
    const id = url.searchParams.get('id');

    let payload: any = null;
    try {
      payload = await req.json();
    } catch {}

    let resource: any = null;
    if (accessToken && id && type) {
      const endpoint = type.includes('order')
        ? `https://api.mercadopago.com/v1/orders/${id}`
        : `https://api.mercadopago.com/v1/payments/${id}`;
      const res = await fetch(endpoint, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });
      if (res.ok) {
        resource = await res.json();
      }
    }

    return NextResponse.json({ ok: true, type, id, payload, resource }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unexpected error' }, { status: 500 });
  }
}
