/**
 * Textile FX v2 RFQ helpers for NeonPay (Celo).
 * @see https://docs.textilecredit.com/api/v2/rfq
 */

import { formatUnits, parseUnits } from 'ethers'
import { CELO_USDT } from '@/config/tokens'
import { RIPIO_WFIAT_TOKENS } from '@/config/ripio'

export const TEXTILE_CELO_CHAIN_ID = 42220
export const TEXTILE_API_BASE = 'https://api.textilecredit.com/v2'
export const TEXTILE_RFQ_MIN_WHOLE_TOKENS = 1
export const TEXTILE_RFQ_EXECUTE_BUFFER_MS = 8_000
export const TEXTILE_LIMIT_ORDER_REACTOR = '0xa9AA0a64769cBed4d3B1Ceb4Df01CdE915C235b3'

export const TEXTILE_SWAP_SYMBOLS = ['wARS', 'wBRL', 'USDT'] as const
export type TextileSwapSymbol = (typeof TEXTILE_SWAP_SYMBOLS)[number]
export type TextileWfiatLeg = 'wARS' | 'wBRL'

export const TEXTILE_TOKEN_DECIMALS: Record<TextileSwapSymbol, number> = {
  wARS: 18,
  wBRL: 18,
  USDT: 6,
}

export const TEXTILE_TOKEN_ADDRESSES: Record<TextileSwapSymbol, string> = {
  wARS: RIPIO_WFIAT_TOKENS.wARS,
  wBRL: RIPIO_WFIAT_TOKENS.wBRL,
  USDT: CELO_USDT,
}

export type TextileUnsignedTx = {
  to: string
  data: string
  value: string
  chainId: number
}

export function isTextileWfiatLeg(value: string): value is TextileWfiatLeg {
  return value === 'wARS' || value === 'wBRL'
}

export function textileCounterpart(
  selected: TextileSwapSymbol,
  other: string
): TextileSwapSymbol {
  if (selected === 'USDT') {
    return isTextileWfiatLeg(other) ? other : 'wBRL'
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
