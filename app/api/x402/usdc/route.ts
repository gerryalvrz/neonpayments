import { NextRequest, NextResponse } from 'next/server';
import { settleAuthorization } from '@/lib/x402/facilitator';
import { type Address } from 'viem';

function decodePaymentHeader(header: string | null) {
  if (!header) return null;
  try {
    const maybeJson = header.startsWith('{') ? header : Buffer.from(header, 'base64').toString('utf-8');
    const obj = JSON.parse(maybeJson);
    return obj;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const xPayment = req.headers.get('x-payment');
  if (!xPayment) {
    return NextResponse.json(
      {
        paymentRequirements: [
          {
            scheme: 'evm-eip3009',
            network: 'base-sepolia',
            price: '$0.01',
          },
        ],
      },
      { status: 402 }
    );
  }

  const payload = decodePaymentHeader(xPayment);
  if (!payload) return NextResponse.json({ error: 'payment_payload_invalid' }, { status: 402 });

  try {
    const { txHash } = await settleAuthorization({
      tokenAddress: (payload.domain?.verifyingContract) as Address,
      eip712Name: payload.eip712?.name || 'USD Coin',
      eip712Version: payload.eip712?.version || '2',
      from: payload.message?.from,
      to: payload.message?.to,
      value: BigInt(payload.message?.value || '0'),
      validAfter: BigInt(payload.message?.validAfter || '0'),
      validBefore: BigInt(payload.message?.validBefore || Math.floor(Date.now() / 1000 + 900)),
      nonce: payload.message?.nonce,
      signature: payload.signature,
      chainId: payload.domain?.chainId ?? 84532,
    });
    return NextResponse.json({ status: 'ok', txHash }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'settle_failed' }, { status: 402 });
  }
}
