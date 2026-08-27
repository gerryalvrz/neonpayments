/**
 * Ripio wFIAT on Celo — public ERC-20s (same address every chain, 18 decimals).
 * Hold / transfer needs no partner account. Mint/redeem still does.
 *
 * @see https://action.ripio.com/en/blog/wfiat-stablecoins-now-live-on-celo
 */

export const RIPIO_WFIAT_TOKENS = {
  wARS: '0x0DC4F92879B7670e5f4e4e6e3c801D229129D90D',
  wBRL: '0xD76f5Faf6888e24D9F04Bf92a0c8B921FE4390e0',
  wMXN: '0x337E7456B420bD3481e7FA61fA9850343d610d34',
  wCOP: '0x8a1D45e102e886510e891d2Ec656a708991e2D76',
  wPEN: '0x4F34c8b3b5FB6D98Da888F0feA543d4d9C9F2eBE',
  wCLP: '0x61D450a098b6a7f69fC4b98CE68198fe59768651',
} as const

export type RipioWfiatSymbol = keyof typeof RIPIO_WFIAT_TOKENS

export const RIPIO_WFIAT_DECIMALS = 18
export const TEXTILE_FX_SWAP_URL = 'https://app.textilecredit.com/s/swap'
export const TEXTILE_FX_CORRIDORS: ReadonlySet<RipioWfiatSymbol> = new Set(['wARS', 'wBRL'])

export const RIPIO_WFIAT_CATALOG: readonly {
  symbol: RipioWfiatSymbol
  name: string
  region: string
}[] = [
  { symbol: 'wARS', name: 'Ripio Argentine Peso', region: 'Argentina' },
  { symbol: 'wBRL', name: 'Ripio Brazilian Real', region: 'Brazil' },
  { symbol: 'wMXN', name: 'Ripio Mexican Peso', region: 'Mexico' },
  { symbol: 'wCOP', name: 'Ripio Colombian Peso', region: 'Colombia' },
  { symbol: 'wPEN', name: 'Ripio Peruvian Sol', region: 'Peru' },
  { symbol: 'wCLP', name: 'Ripio Chilean Peso', region: 'Chile' },
]

export function isRipioWfiatSymbol(value: string): value is RipioWfiatSymbol {
  return Object.prototype.hasOwnProperty.call(RIPIO_WFIAT_TOKENS, value)
}

export function getTextileFxSwapUrl(symbol: string): string | null {
  if (!isRipioWfiatSymbol(symbol)) return null
  if (!TEXTILE_FX_CORRIDORS.has(symbol)) return null
  return TEXTILE_FX_SWAP_URL
}

export function isValidCeloAddress(value: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(value)
}
