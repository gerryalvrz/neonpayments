import { NextRequest, NextResponse } from 'next/server'
import { isValidCeloAddress } from '@/config/ripio'
import {
  fromMentoAtomic,
  mentoNoQuoteMessage,
  resolveMentoPair,
  toMentoAtomic,
} from '@/utils/mento/swap'
import { quoteMentoSwap } from '@/utils/mento/server'

export const runtime = 'nodejs'
export const maxDuration = 30

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const sellSymbol = typeof body.sellSymbol === 'string' ? body.sellSymbol.trim() : ''
    const buySymbol = typeof body.buySymbol === 'string' ? body.buySymbol.trim() : ''
    const sellAmount = typeof body.sellAmount === 'string' ? body.sellAmount.trim() : ''
    const address = typeof body.address === 'string' ? body.address.trim() : ''
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

    if (address && !isValidCeloAddress(address)) {
      return NextResponse.json({ error: 'Invalid address' }, { status: 400 })
    }

    const quoted = await quoteMentoSwap(pair, sellAmount)
    if (!quoted.ok) {
      return NextResponse.json({
        venue: 'mento',
        liveExecution: false,
        status: 'no_quote',
        reason: quoted.reason,
        sellSymbol: pair.sellSymbol,
        buySymbol: pair.buySymbol,
        sellAmount,
        buyAmount: null,
        hint: mentoNoQuoteMessage(quoted.reason, language),
      })
    }

    const sellAtomic = toMentoAtomic(sellAmount, pair.sellSymbol)
    return NextResponse.json({
      venue: 'mento',
      liveExecution: true,
      status: 'preview',
      sellSymbol: pair.sellSymbol,
      buySymbol: pair.buySymbol,
      sellAmount,
      sellAtomic,
      buyAmount: fromMentoAtomic(quoted.amountOut.toString(), pair.buySymbol),
      buyAtomic: quoted.amountOut.toString(),
      hint:
        language === 'es'
          ? 'Swap on-chain de Mento. Al confirmar firmas en Celo (~0,5% de slippage).'
          : 'On-chain Mento swap. Confirming signs on Celo (~0.5% slippage).',
    })
  } catch (error) {
    console.error('[mento/quote]', error)
    return NextResponse.json(
      {
        error: 'Could not quote Mento swap',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
