/**
 * Textile FX v2 RFQ helpers for NeonPay (Celo).
 * @see https://docs.textilecredit.com/api/v2/rfq
 */

import { formatUnits, parseUnits } from 'ethers'
import { CELO_USDT } from '@/config/tokens'
import {
  RIPIO_WFIAT_DECIMALS,
  RIPIO_WFIAT_TOKENS,
  TEXTILE_FX_CORRIDORS,
  type RipioWfiatSymbol,
} from '@/config/ripio'

export const TEXTILE_CELO_CHAIN_ID = 42220
export const TEXTILE_API_BASE = 'https://api.textilecredit.com/v2'
export const TEXTILE_RFQ_MIN_WHOLE_TOKENS = 1
export const TEXTILE_RFQ_EXECUTE_BUFFER_MS = 8_000
export const TEXTILE_LIMIT_ORDER_REACTOR = '0xa9AA0a64769cBed4d3B1Ceb4Df01CdE915C235b3'

/** Live Ripio legs. Adding a symbol to TEXTILE_FX_CORRIDORS turns the pair on here. */
export const TEXTILE_LIVE_WFIAT = [...TEXTILE_FX_CORRIDORS] as RipioWfiatSymbol[]
export type TextileWfiatLeg = RipioWfiatSymbol
export type TextileSwapSymbol = 'USDT' | TextileWfiatLeg

export const TEXTILE_SWAP_SYMBOLS: TextileSwapSymbol[] = ['USDT', ...TEXTILE_LIVE_WFIAT]
export const TEXTILE_DEFAULT_WFIAT: TextileWfiatLeg = TEXTILE_FX_CORRIDORS.has('wBRL')
  ? 'wBRL'
  : TEXTILE_LIVE_WFIAT[0]

export const TEXTILE_TOKEN_DECIMALS: Record<string, number> = {
  USDT: 6,
  ...Object.fromEntries(TEXTILE_LIVE_WFIAT.map((symbol) => [symbol, RIPIO_WFIAT_DECIMALS])),
}

export const TEXTILE_TOKEN_ADDRESSES: Record<string, string> = {
  USDT: CELO_USDT,
  ...Object.fromEntries(TEXTILE_LIVE_WFIAT.map((symbol) => [symbol, RIPIO_WFIAT_TOKENS[symbol]])),
}

export type TextileUnsignedTx = {
  to: string
  data: string
  value: string
  chainId: number
}

export function isTextileWfiatLeg(value: string): value is TextileWfiatLeg {
  return TEXTILE_FX_CORRIDORS.has(value as RipioWfiatSymbol)
}

export function isTextileSwapSymbol(value: string): value is TextileSwapSymbol {
  return value === 'USDT' || isTextileWfiatLeg(value)
}

export function textileComingSoonWfiat(): RipioWfiatSymbol[] {
  return (Object.keys(RIPIO_WFIAT_TOKENS) as RipioWfiatSymbol[]).filter(
    (symbol) => !TEXTILE_FX_CORRIDORS.has(symbol)
  )
}

export function textileLiveRouteLabels(): string[] {
  return TEXTILE_LIVE_WFIAT.map((symbol) => `USDT ↔ ${symbol}`)
}

export function textileCounterpart(
  selected: TextileSwapSymbol,
  other: string
): TextileSwapSymbol {
  if (selected === 'USDT') {
    return isTextileWfiatLeg(other) ? other : TEXTILE_DEFAULT_WFIAT
  }
  return 'USDT'
}

export function resolveTextilePair(
  sellSymbol: string,
  buySymbol: string
): { sellSymbol: TextileSwapSymbol; buySymbol: TextileSwapSymbol; wfiat: TextileWfiatLeg } | null {
  if (sellSymbol === buySymbol) return null
  if (sellSymbol === 'USDT' && isTextileWfiatLeg(buySymbol)) {
    return { sellSymbol: 'USDT', buySymbol, wfiat: buySymbol }
  }
  if (buySymbol === 'USDT' && isTextileWfiatLeg(sellSymbol)) {
    return { sellSymbol, buySymbol: 'USDT', wfiat: sellSymbol }
  }
  return null
}

export function toAtomicAmount(human: string, symbol: TextileSwapSymbol): string {
  return parseUnits(human, TEXTILE_TOKEN_DECIMALS[symbol]).toString()
}

export function fromAtomicAmount(atomic: string, symbol: TextileSwapSymbol, digits = 6): string {
  const formatted = formatUnits(atomic, TEXTILE_TOKEN_DECIMALS[symbol])
  const n = Number(formatted)
  if (!Number.isFinite(n)) return formatted
  return n.toLocaleString('en-US', {
    useGrouping: false,
    maximumFractionDigits: digits,
  })
}

export function isBelowTextileRfqMinimum(human: string): boolean {
  const n = Number(human)
  return !Number.isFinite(n) || n < TEXTILE_RFQ_MIN_WHOLE_TOKENS
}

export function rfqNoQuoteMessage(
  reason?: string | null,
  language: 'en' | 'es' = 'en',
  wfiat?: TextileWfiatLeg | string | null
): string {
  const thinWars = wfiat === 'wARS'
  if (language === 'es') {
    switch (reason) {
      case 'no_makers_online':
        return thinWars
          ? 'Textile aún está armando liquidez en wARS. Confirma de nuevo o usa wBRL.'
          : 'Ningún maker cotizó en este segundo. Confirma de nuevo.'
      case 'no_valid_quote':
        return 'Nadie cotizó este monto ahora. RFQ no hace fills parciales.'
      default:
        return 'Nadie cotizó este monto ahora. Confirma de nuevo.'
    }
  }
  switch (reason) {
    case 'no_makers_online':
      return thinWars
        ? 'Textile is still onboarding liquidity on wARS. Confirm again or use wBRL.'
        : 'No maker quoted this second. Confirm again.'
    case 'no_valid_quote':
      return 'Nobody quoted this size. RFQ is all-or-nothing — try another amount.'
    default:
      return 'Nobody quoted this size right now. Confirm again.'
  }
}

export function isTextileQuoteTooCloseToExpiry(expiresAt?: string | null, now = Date.now()): boolean {
  if (!expiresAt) return false
  const expiresMs = Date.parse(expiresAt)
  if (!Number.isFinite(expiresMs)) return false
  return expiresMs - now < TEXTILE_RFQ_EXECUTE_BUFFER_MS
}
