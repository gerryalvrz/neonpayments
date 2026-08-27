/**
 * Server-only Mento SDK. Do not import from client components.
 * MiniPay never loads this file.
 */

import { ChainId, deadlineFromMinutes, Mento, RouteNotFoundError } from '@mento-protocol/mento-sdk'
import { getAddress, type Address } from 'viem'
import {
  fromMentoAtomic,
  MENTO_CELO_CHAIN_ID,
  MENTO_SLIPPAGE_PERCENT,
  mentoTokenAddress,
  toMentoAtomic,
  type MentoPair,
  type MentoUnsignedTx,
} from './swap'

let mentoPromise: Promise<Mento> | null = null

function rpcUrl() {
  return (
    process.env.CELO_RPC_URL ||
    process.env.NEXT_PUBLIC_CELO_RPC_URL ||
    'https://forno.celo.org'
  )
}

export function getMentoClient() {
  if (!mentoPromise) {
    mentoPromise = Mento.create(ChainId.CELO, rpcUrl())
  }
  return mentoPromise
}

export type MentoQuoteFailure = {
  ok: false
  reason: 'no_route' | 'not_tradable' | 'no_quote'
}

export type MentoQuoteSuccess = {
  ok: true
  tokenIn: Address
  tokenOut: Address
  amountIn: bigint
  amountOut: bigint
}

function isNoRoute(error: unknown) {
  if (error instanceof RouteNotFoundError) return true
  const message = error instanceof Error ? error.message : String(error)
  return message.toLowerCase().includes('no route found')
}

export async function quoteMentoSwap(
  pair: MentoPair,
  sellAmountHuman: string
): Promise<MentoQuoteSuccess | MentoQuoteFailure> {
  const mento = await getMentoClient()
  const tokenIn = getAddress(mentoTokenAddress(pair.sellSymbol))
  const tokenOut = getAddress(mentoTokenAddress(pair.buySymbol))
  const amountIn = BigInt(toMentoAtomic(sellAmountHuman, pair.sellSymbol))

  let tradable = false
  try {
    tradable = await mento.trading.isPairTradable(tokenIn, tokenOut)
  } catch (error) {
    if (isNoRoute(error)) return { ok: false, reason: 'no_route' }
    throw error
  }
  if (!tradable) return { ok: false, reason: 'not_tradable' }

  const amountOut = await mento.quotes.getAmountOut(tokenIn, tokenOut, amountIn)
  if (amountOut <= 0n) return { ok: false, reason: 'no_quote' }

  return { ok: true, tokenIn, tokenOut, amountIn, amountOut }
}

function asUnsignedTx(params: { to: string; data: string; value?: string }): MentoUnsignedTx {
  return {
    to: params.to,
    data: params.data,
    value: params.value || '0x0',
    chainId: MENTO_CELO_CHAIN_ID,
  }
}

export async function buildMentoSwap(params: {
  pair: MentoPair
  sellAmountHuman: string
  taker: string
}) {
  const quoted = await quoteMentoSwap(params.pair, params.sellAmountHuman)
  if (!quoted.ok) return quoted

  const mento = await getMentoClient()
  const taker = getAddress(params.taker)
  const { approval, swap } = await mento.swap.buildSwapTransaction(
    quoted.tokenIn,
    quoted.tokenOut,
    quoted.amountIn,
    taker,
    taker,
    {
      slippageTolerance: MENTO_SLIPPAGE_PERCENT,
      deadline: deadlineFromMinutes(5),
    }
  )

  return {
    ok: true as const,
    amountIn: quoted.amountIn,
    amountOut: quoted.amountOut,
    amountOutMin: swap.amountOutMin,
    hops: swap.route.path.length,
    buyAmount: fromMentoAtomic(quoted.amountOut.toString(), params.pair.buySymbol),
    buyAtomic: quoted.amountOut.toString(),
    transactions: {
      approval: approval ? asUnsignedTx(approval) : null,
      swap: asUnsignedTx(swap.params),
    },
  }
}
