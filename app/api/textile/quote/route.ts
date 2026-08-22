import { NextRequest, NextResponse } from 'next/server'
import { isValidCeloAddress } from '@/config/ripio'
import {
  fromAtomicAmount,
  isBelowTextileRfqMinimum,
  resolveTextilePair,
  rfqNoQuoteMessage,
  toAtomicAmount,
  TEXTILE_TOKEN_ADDRESSES,
} from '@/utils/textile/fx'
import { previewTextileRfq } from '@/utils/textile/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const sellSymbol = typeof body.sellSymbol === 'string' ? body.sellSymbol.trim() : ''
    const buySymbol = typeof body.buySymbol === 'string' ? body.buySymbol.trim() : ''
    const sellAmount = typeof body.sellAmount === 'string' ? body.sellAmount.trim() : ''
    const address = typeof body.address === 'string' ? body.address.trim() : ''
    const language = body.language === 'es' ? 'es' : 'en'

    const pair = resolveTextilePair(sellSymbol, buySymbol)
    if (!pair) {
      return NextResponse.json(
        { error: 'Unsupported pair. Use wARS or wBRL against USDT on Celo.' },
        { status: 400 }
      )
    }

    if (!sellAmount || Number(sellAmount) <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })
    }

    if (isBelowTextileRfqMinimum(sellAmount)) {
      return NextResponse.json(
        {
          error: `RFQ minimum is 1 whole ${pair.sellSymbol}.`,
          liveExecution: false,
        },
        { status: 400 }
      )
    }

    if (address && !isValidCeloAddress(address)) {
      return NextResponse.json({ error: 'Invalid address' }, { status: 400 })
    }

    const sellAtomic = toAtomicAmount(sellAmount, pair.sellSymbol)
    const preview = await previewTextileRfq({
      sellToken: TEXTILE_TOKEN_ADDRESSES[pair.sellSymbol],
      buyToken: TEXTILE_TOKEN_ADDRESSES[pair.buySymbol],
      sellAmount: sellAtomic,
    })

    if (!preview.ok) {
      return NextResponse.json(
        { error: preview.error, liveExecution: false },
        { status: preview.status >= 400 && preview.status < 600 ? preview.status : 502 }
      )
    }

    if (preview.data.status === 'no_quote' || !preview.data.buyAmount) {
      const availableSell = preview.data.availableSellAmount
        ? fromAtomicAmount(preview.data.availableSellAmount, pair.sellSymbol)
        : null
      return NextResponse.json({
        mode: 'rfq',
        venue: 'v2',
        liveExecution: false,
        status: 'no_quote',
        reason: preview.data.reason,
        sellSymbol: pair.sellSymbol,
        buySymbol: pair.buySymbol,
        sellAmount,
        buyAmount: null,
        availableSellAmount: availableSell,
        hint: availableSell
          ? `${rfqNoQuoteMessage(preview.data.reason, language, pair.wfiat)} Published depth: ~${availableSell} ${pair.sellSymbol}.`
          : rfqNoQuoteMessage(preview.data.reason, language, pair.wfiat),
      })
    }

    return NextResponse.json({
      mode: 'rfq',
      venue: 'v2',
      liveExecution: true,
      status: 'preview',
      sellSymbol: pair.sellSymbol,
      buySymbol: pair.buySymbol,
      sellAmount,
      sellAtomic,
      buyAmount: fromAtomicAmount(preview.data.buyAmount, pair.buySymbol),
      takerPays: preview.data.takerPays,
      feeAmount: preview.data.feeAmount,
      effectiveRateRay: preview.data.rateRay,
      availableSellAmount: preview.data.availableSellAmount
        ? fromAtomicAmount(preview.data.availableSellAmount, pair.sellSymbol)
        : null,
      hint: 'Indicative RFQ. Confirming asks for a firm quote (~30s).',
    })
  } catch (error) {
    console.error('[textile/quote]', error)
    return NextResponse.json(
      {
        error: 'Could not quote swap',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
