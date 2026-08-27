import { NextRequest, NextResponse } from 'next/server'
import { isValidCeloAddress } from '@/config/ripio'
import { mentoNoQuoteMessage, resolveMentoPair } from '@/utils/mento/swap'
import { buildMentoSwap } from '@/utils/mento/server'

export const runtime = 'nodejs'
export const maxDuration = 30

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const sellSymbol = typeof body.sellSymbol === 'string' ? body.sellSymbol.trim() : ''
    const buySymbol = typeof body.buySymbol === 'string' ? body.buySymbol.trim() : ''
    const sellAmount = typeof body.sellAmount === 'string' ? body.sellAmount.trim() : ''
    const taker = typeof body.taker === 'string' ? body.taker.trim() : ''
    const language = body.language === 'es' ? 'es' : 'en'

    const pair = resolveMentoPair(sellSymbol, buySymbol)
    if (!pair) {
      return NextResponse.json(
        {
          error: 'Unsupported pair. Use a Mento stable against another Mento stable, USDC, or USDT.',
        },
        { status: 400 }
      )
    }

    if (!sellAmount || Number(sellAmount) <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })
    }

    if (!isValidCeloAddress(taker)) {
      return NextResponse.json({ error: 'Invalid taker' }, { status: 400 })
    }

    const built = await buildMentoSwap({ pair, sellAmountHuman: sellAmount, taker })
    if (!built.ok) {
      return NextResponse.json({
        fillable: false,
        venue: 'mento',
        reason: built.reason,
        hint: mentoNoQuoteMessage(built.reason, language),
      })
    }

    return NextResponse.json({
      fillable: true,
      venue: 'mento',
      sellSymbol: pair.sellSymbol,
      buySymbol: pair.buySymbol,
      buyAmount: built.buyAmount,
      buyAtomic: built.buyAtomic,
      amountOutMin: built.amountOutMin.toString(),
      hops: built.hops,
      transactions: built.transactions,
    })
  } catch (error) {
    console.error('[mento/swap]', error)
    return NextResponse.json(
      {
        error: 'Could not build Mento swap',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
