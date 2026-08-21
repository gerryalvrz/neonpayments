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
import { requestTextileRfq } from '@/utils/textile/server'

export const maxDuration = 15

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const sellSymbol = typeof body.sellSymbol === 'string' ? body.sellSymbol.trim() : ''
    const buySymbol = typeof body.buySymbol === 'string' ? body.buySymbol.trim() : ''
    const sellAmount = typeof body.sellAmount === 'string' ? body.sellAmount.trim() : ''
    const taker = typeof body.taker === 'string' ? body.taker.trim() : ''

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
        { error: `RFQ minimum is 1 whole ${pair.sellSymbol}.` },
        { status: 400 }
      )
    }

    if (!isValidCeloAddress(taker)) {
      return NextResponse.json({ error: 'Invalid taker' }, { status: 400 })
    }

    const built = await requestTextileRfq({
      sellToken: TEXTILE_TOKEN_ADDRESSES[pair.sellSymbol],
      buyToken: TEXTILE_TOKEN_ADDRESSES[pair.buySymbol],
      sellAmount: toAtomicAmount(sellAmount, pair.sellSymbol),
      taker,
    })

    if (!built.ok) {
      return NextResponse.json(
        { error: built.error },
        { status: built.status >= 400 && built.status < 600 ? built.status : 502 }
      )
    }

    if (built.data.status !== 'quoted' || !built.data.transactions?.swap) {
      const availableSell = built.data.availableSellAmount
        ? fromAtomicAmount(built.data.availableSellAmount, pair.sellSymbol)
        : null
      return NextResponse.json({
        fillable: false,
        status: built.data.status,
        reason: built.data.reason || 'no_quote',
        hint: availableSell
          ? `${rfqNoQuoteMessage(built.data.reason)} Published depth: ~${availableSell} ${pair.sellSymbol}.`
          : rfqNoQuoteMessage(built.data.reason),
        availableSellAmount: availableSell,
      })
    }

    const quote = built.data.quote
    return NextResponse.json({
      fillable: true,
      venue: 'v2',
      id: built.data.rfqId,
      claimToken: built.data.claimToken,
      status: built.data.status,
      expiresAt: quote?.expiresAt,
      orderDeadline: quote?.orderDeadline,
      buyAmount: quote?.buyAmount
        ? fromAtomicAmount(quote.buyAmount, pair.buySymbol)
        : null,
      takerPays: quote?.takerPays,
      feeAmount: quote?.feeAmount,
      transactions: built.data.transactions,
    })
  } catch (error) {
    console.error('[textile/swap]', error)
    return NextResponse.json(
      {
        error: 'Could not build swap',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
