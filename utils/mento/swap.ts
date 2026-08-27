/**
 * Client-safe Mento pair helpers. The SDK stays on the server so MiniPay
 * does not load viem + @mento-protocol/mento-sdk.
 */

import { formatUnits, parseUnits } from 'ethers'
import { isMentoSymbol, resolveMentoSymbol, type MentoSymbol } from '@/config/mento'
import { CELO_USDC, CELO_USDT, getToken } from '@/config/tokens'

export const MENTO_CELO_CHAIN_ID = 42220
export const MENTO_SLIPPAGE_PERCENT = 0.5

export const MENTO_USD_SYMBOLS = ['USDC', 'USDT'] as const
export type MentoUsdSymbol = (typeof MENTO_USD_SYMBOLS)[number]
export type MentoSwapSymbol = MentoSymbol | MentoUsdSymbol

export type MentoPair = {
  sellSymbol: MentoSwapSymbol
  buySymbol: MentoSwapSymbol
}

export type MentoUnsignedTx = {
  to: string
  data: string
  value: string
  chainId: number
}

export function isMentoUsdSymbol(value: string): value is MentoUsdSymbol {
  return (MENTO_USD_SYMBOLS as readonly string[]).includes(value)
}

export function resolveMentoSwapSymbol(value: string): MentoSwapSymbol | undefined {
  const mento = resolveMentoSymbol(value)
  if (mento) return mento
  if (isMentoUsdSymbol(value)) return value
  return undefined
}

export function isMentoSwapSymbol(value: string): value is MentoSwapSymbol {
  return Boolean(resolveMentoSwapSymbol(value))
}

export function mentoTokenDecimals(symbol: MentoSwapSymbol): number {
  return getToken(symbol)?.decimals ?? (isMentoUsdSymbol(symbol) ? 6 : 18)
}

export function mentoTokenAddress(symbol: MentoSwapSymbol): string {
  if (symbol === 'USDC') return CELO_USDC
  if (symbol === 'USDT') return CELO_USDT
  const token = getToken(symbol)
  if (!token?.address) {
    throw new Error(`Unknown Mento token ${symbol}`)
  }
  return token.address
}

/**
 * Live Mento venue: Mento stable ↔ Mento stable, or Mento stable ↔ USDC/USDT.
 * USDC ↔ USDT is Squid later, not this venue.
 */
export function resolveMentoPair(sellSymbol: string, buySymbol: string): MentoPair | null {
  const sell = resolveMentoSwapSymbol(sellSymbol)
  const buy = resolveMentoSwapSymbol(buySymbol)
  if (!sell || !buy || sell === buy) return null

  const sellIsMento = isMentoSymbol(sell)
  const buyIsMento = isMentoSymbol(buy)
  if (!sellIsMento && !buyIsMento) return null

  return { sellSymbol: sell, buySymbol: buy }
}

export function mentoCounterpart(selected: string, other: string): MentoSwapSymbol {
  const resolved = resolveMentoSwapSymbol(selected)
  if (!resolved) return 'USDC'

  if (isMentoSymbol(resolved)) {
    const otherResolved = resolveMentoSwapSymbol(other)
    if (otherResolved && resolveMentoPair(resolved, otherResolved)) {
      return otherResolved
    }
    return 'USDC'
  }

  const otherMento = resolveMentoSymbol(other)
  return otherMento ?? 'USDm'
}

export function toMentoAtomic(human: string, symbol: MentoSwapSymbol): string {
  return parseUnits(human, mentoTokenDecimals(symbol)).toString()
}

export function fromMentoAtomic(atomic: string, symbol: MentoSwapSymbol, digits = 6): string {
  const formatted = formatUnits(atomic, mentoTokenDecimals(symbol))
  const n = Number(formatted)
  if (!Number.isFinite(n)) return formatted
  return n.toLocaleString('en-US', {
    useGrouping: false,
    maximumFractionDigits: digits,
  })
}

export function mentoNoQuoteMessage(
  reason: string | undefined,
  language: 'en' | 'es'
): string {
  const es = language === 'es'
  if (reason === 'not_tradable') {
    return es
      ? 'Mento tiene este par en pausa (circuit breaker o límite). Intenta de nuevo más tarde.'
      : 'Mento has this pair paused (circuit breaker or limit). Try again later.'
  }
  if (reason === 'no_route') {
    return es
      ? 'Mento aún no tiene una ruta para este par.'
      : 'Mento does not have a route for this pair yet.'
  }
  return es ? 'Mento no cotizó este par ahora.' : 'Mento could not quote this pair just now.'
}
