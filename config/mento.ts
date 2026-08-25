/**
 * Mento stables on Celo mainnet — public ERC-20s (18 decimals).
 * V3 tickers are *m (USDm, EURm, …). Same contracts as the old cUSD / cEUR / cREAL names.
 *
 * @see https://docs.mento.org/mento-v3/build/deployments/addresses
 * @see https://docs.celo.org/build-on-celo/build-with-local-stablecoin
 */

export const MENTO_TOKENS = {
  USDm: '0x765DE816845861e75A25fCA122bb6898B8B1282a',
  EURm: '0xD8763CBa276a3738E6DE85b4b3bF5FDed6D6cA73',
  BRLm: '0xe8537a3d056DA446677B9E9d6c5dB704EaAb4787',
  COPm: '0x8A567e2aE79CA692Bd748aB832081C45de4041eA',
  CADm: '0xff4Ab19391af240c311c54200a492233052B6325',
  GBPm: '0xCCF663b1fF11028f0b19058d0f7B674004a40746',
  CHFm: '0xb55a79F398E759E43C95b979163f30eC87Ee131D',
  KESm: '0x456a3D042C0DbD3db53D5489e98dFb038553B0d0',
  NGNm: '0xE2702Bd97ee33c88c8f6f92DA3B733608aa76F71',
  GHSm: '0xfAeA5F3404bbA20D3cc2f8C4B0A888F55a3c7313',
  ZARm: '0x4c35853A3B4e647fD266f4de678dCc8fEC410BF6',
  XOFm: '0x73F93dcc49cB8A239e2032663e9475dd5ef29A08',
  JPYm: '0xc45eCF20f3CD864B32D9794d6f76814aE8892e20',
  PHPm: '0x105d4A9306D2E55a71d2Eb95B81553AE1dC20d7B',
  AUDm: '0x7175504C455076F15c04A2F90a8e352281F492F9',
} as const

export type MentoSymbol = keyof typeof MENTO_TOKENS

export const MENTO_DECIMALS = 18

/** Old MiniPay / Mento v2 tickers → current v3 symbols. Contracts did not change. */
export const MENTO_LEGACY_SYMBOLS: Record<string, MentoSymbol> = {
  cUSD: 'USDm',
  cEUR: 'EURm',
  cREAL: 'BRLm',
  cCOP: 'COPm',
  cCAD: 'CADm',
  cGBP: 'GBPm',
  cCHF: 'CHFm',
  cKES: 'KESm',
  cNGN: 'NGNm',
  cGHS: 'GHSm',
  cZAR: 'ZARm',
  eXOF: 'XOFm',
  cJPY: 'JPYm',
  PUSO: 'PHPm',
  cAUD: 'AUDm',
}

export const MENTO_CATALOG: readonly {
  symbol: MentoSymbol
  name: string
  region: string
}[] = [
  { symbol: 'USDm', name: 'Mento Dollar', region: 'United States' },
  { symbol: 'EURm', name: 'Mento Euro', region: 'Eurozone' },
  { symbol: 'BRLm', name: 'Mento Brazilian Real', region: 'Brazil' },
  { symbol: 'COPm', name: 'Mento Colombian Peso', region: 'Colombia' },
  { symbol: 'CADm', name: 'Mento Canadian Dollar', region: 'Canada' },
  { symbol: 'GBPm', name: 'Mento Pound Sterling', region: 'United Kingdom' },
  { symbol: 'CHFm', name: 'Mento Swiss Franc', region: 'Switzerland' },
  { symbol: 'KESm', name: 'Mento Kenyan Shilling', region: 'Kenya' },
  { symbol: 'NGNm', name: 'Mento Nigerian Naira', region: 'Nigeria' },
  { symbol: 'GHSm', name: 'Mento Ghanaian Cedi', region: 'Ghana' },
  { symbol: 'ZARm', name: 'Mento South African Rand', region: 'South Africa' },
  { symbol: 'XOFm', name: 'Mento CFA Franc', region: 'West Africa' },
  { symbol: 'JPYm', name: 'Mento Japanese Yen', region: 'Japan' },
  { symbol: 'PHPm', name: 'Mento Philippine Peso', region: 'Philippines' },
  { symbol: 'AUDm', name: 'Mento Australian Dollar', region: 'Australia' },
]

export const MENTO_REGION_SYMBOLS = {
  americas: ['USDm', 'BRLm', 'CADm', 'COPm'],
  europe: ['EURm', 'GBPm', 'CHFm'],
  africa: ['KESm', 'NGNm', 'GHSm', 'ZARm', 'XOFm'],
  asiaPacific: ['JPYm', 'PHPm', 'AUDm'],
} as const

export const MENTO_REGION_ORDER = ['americas', 'europe', 'africa', 'asiaPacific'] as const
export type MentoRegionId = (typeof MENTO_REGION_ORDER)[number]

export const MENTO_PAYMENT_SYMBOLS = [
  ...MENTO_REGION_SYMBOLS.americas,
  ...MENTO_REGION_SYMBOLS.europe,
  ...MENTO_REGION_SYMBOLS.africa,
  ...MENTO_REGION_SYMBOLS.asiaPacific,
] as const

export type MentoPaymentSymbol = (typeof MENTO_PAYMENT_SYMBOLS)[number]

export function isMentoSymbol(value: string): value is MentoSymbol {
  return Object.prototype.hasOwnProperty.call(MENTO_TOKENS, value)
}

export function resolveMentoSymbol(value: string): MentoSymbol | undefined {
  if (isMentoSymbol(value)) return value
  return MENTO_LEGACY_SYMBOLS[value]
}

export function isMentoPaymentSymbol(value: string): value is MentoPaymentSymbol {
  return (MENTO_PAYMENT_SYMBOLS as readonly string[]).includes(resolveMentoSymbol(value) ?? value)
}
