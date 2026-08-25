import {
  MENTO_CATALOG,
  MENTO_DECIMALS,
  MENTO_PAYMENT_SYMBOLS,
  MENTO_REGION_ORDER,
  MENTO_REGION_SYMBOLS,
  MENTO_TOKENS,
  resolveMentoSymbol,
} from './mento'
import { RIPIO_WFIAT_CATALOG, RIPIO_WFIAT_DECIMALS, RIPIO_WFIAT_TOKENS, isRipioWfiatSymbol } from './ripio'

export type TokenFamily = 'mento' | 'ripio' | 'usd'

export interface Token {
  symbol: string
  name: string
  address: string
  decimals: number
  logo: string
  family?: TokenFamily
  isNative?: boolean
  isStablecoin?: boolean
  isMento?: boolean
  isWfiat?: boolean
}

const STABLE_LOGO =
  'https://raw.githubusercontent.com/ubeswap/default-token-list/master/assets/asset_cUSD.png'

export const CELO_USDT = '0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e'
export const CELO_USDC = '0xceba9300f2b948710d2653dd7b07f33a8b32118c'

export const tokens: Token[] = [
  {
    symbol: 'CELO',
    name: 'Celo',
    address: '0x471EcE3750Da237f93B8E339c536989b8978a438',
    decimals: 18,
    logo: 'https://raw.githubusercontent.com/ubeswap/default-token-list/master/assets/asset_CELO.png',
    isNative: true,
  },
  {
    symbol: 'USDC',
    name: 'USD Coin',
    address: CELO_USDC,
    decimals: 6,
    logo: STABLE_LOGO,
    family: 'usd',
    isStablecoin: true,
  },
  {
    symbol: 'USDT',
    name: 'Tether USD',
    address: CELO_USDT,
    decimals: 6,
    logo: STABLE_LOGO,
    family: 'usd',
    isStablecoin: true,
  },
  {
    symbol: 'X402',
    name: 'X402 Token',
    address: '0x37290B3f613344Ef22750f732aa9dF846f80DDA0',
    decimals: 18,
    logo: STABLE_LOGO,
  },
  ...MENTO_CATALOG.map((row) => ({
    symbol: row.symbol,
    name: row.name,
    address: MENTO_TOKENS[row.symbol],
    decimals: MENTO_DECIMALS,
    logo: STABLE_LOGO,
    family: 'mento' as const,
    isStablecoin: true,
    isMento: true,
  })),
  ...RIPIO_WFIAT_CATALOG.map((row) => ({
    symbol: row.symbol,
    name: row.name,
    address: RIPIO_WFIAT_TOKENS[row.symbol],
    decimals: RIPIO_WFIAT_DECIMALS,
    logo: STABLE_LOGO,
    family: 'ripio' as const,
    isStablecoin: true,
    isWfiat: true,
  })),
]

export const USD_PAYMENT_SYMBOLS = ['USDC', 'USDT'] as const
export const RIPIO_PAYMENT_SYMBOLS = ['wARS', 'wBRL', 'wMXN', 'wCOP', 'wPEN', 'wCLP'] as const

export const PAYMENT_SYMBOLS = [
  ...MENTO_PAYMENT_SYMBOLS,
  ...USD_PAYMENT_SYMBOLS,
  ...RIPIO_PAYMENT_SYMBOLS,
] as const

export type PaymentSymbol = (typeof PAYMENT_SYMBOLS)[number]
export type { MentoPaymentSymbol, MentoRegionId } from './mento'
export { MENTO_PAYMENT_SYMBOLS, MENTO_REGION_ORDER, MENTO_REGION_SYMBOLS } from './mento'

export const TOKEN_FAMILY_LABELS = {
  en: { mento: 'Mento', ripio: 'Ripio', usd: 'USD' },
  es: { mento: 'Mento', ripio: 'Ripio', usd: 'USD' },
} as const

export const MENTO_REGION_LABELS = {
  en: {
    americas: 'Americas',
    europe: 'Europe',
    africa: 'Africa',
    asiaPacific: 'Asia-Pacific',
  },
  es: {
    americas: 'Américas',
    europe: 'Europa',
    africa: 'África',
    asiaPacific: 'Asia-Pacífico',
  },
} as const

export type PaymentListGroup = {
  id: string
  family: TokenFamily
  label: string
  symbols: readonly PaymentSymbol[]
}

export function defaultVisiblePaymentSymbols(): PaymentSymbol[] {
  return [
    ...MENTO_REGION_SYMBOLS.americas,
    ...USD_PAYMENT_SYMBOLS,
    ...RIPIO_PAYMENT_SYMBOLS,
  ]
}

export function getTokenFamily(symbol: string): TokenFamily | undefined {
  if (resolveMentoSymbol(symbol)) return 'mento'
  if (isRipioWfiatSymbol(symbol)) return 'ripio'
  if ((USD_PAYMENT_SYMBOLS as readonly string[]).includes(symbol)) return 'usd'
  return getToken(symbol)?.family
}

export function resolvePaymentSymbol(value: string): PaymentSymbol | undefined {
  const mento = resolveMentoSymbol(value)
  if (mento && (PAYMENT_SYMBOLS as readonly string[]).includes(mento)) return mento as PaymentSymbol
  if ((PAYMENT_SYMBOLS as readonly string[]).includes(value)) return value as PaymentSymbol
  return undefined
}

export function migrateVisiblePaymentSymbols(saved: unknown): PaymentSymbol[] {
  const compact = defaultVisiblePaymentSymbols()
  if (!Array.isArray(saved)) return compact
  const resolved = saved.flatMap((row) => {
    const next = typeof row === 'string' ? resolvePaymentSymbol(row) : undefined
    return next ? [next] : []
  })
  const unique = [...new Set(resolved)]
  if (!unique.length) return compact
  if (unique.length >= PAYMENT_SYMBOLS.length) return compact
  return unique
}

export function mentoRegionGroups(language: 'en' | 'es' = 'en'): PaymentListGroup[] {
  const labels = MENTO_REGION_LABELS[language]
  return MENTO_REGION_ORDER.map((id) => ({
    id,
    family: 'mento' as const,
    label: labels[id],
    symbols: MENTO_REGION_SYMBOLS[id],
  }))
}

export function paymentTokenGroups(language: 'en' | 'es' = 'en'): PaymentListGroup[] {
  const labels = TOKEN_FAMILY_LABELS[language]
  return [
    ...mentoRegionGroups(language),
    { id: 'usd', family: 'usd', label: labels.usd, symbols: USD_PAYMENT_SYMBOLS },
    { id: 'ripio', family: 'ripio', label: labels.ripio, symbols: RIPIO_PAYMENT_SYMBOLS },
  ]
}

export function groupedPaymentOptions(
  language: 'en' | 'es' = 'en',
  symbols?: readonly string[]
): { value: PaymentSymbol; label: string; group: string }[] {
  const allow = symbols ? new Set(symbols) : null
  return paymentTokenGroups(language).flatMap((group) =>
    group.symbols
      .filter((symbol) => !allow || allow.has(symbol))
      .map((symbol) => ({
        value: symbol,
        label: symbol,
        group: group.label,
      }))
  )
}

export function getToken(symbol: string): Token | undefined {
  const resolved = resolveMentoSymbol(symbol) ?? symbol
  return tokens.find((row) => row.symbol === resolved)
}

export function getTokenAddress(symbol: string): string | undefined {
  return getToken(symbol)?.address
}

export function zeroBalances(): Record<string, number> {
  const next: Record<string, number> = {}
  for (const symbol of PAYMENT_SYMBOLS) next[symbol] = 0
  return next
}

export default { tokens }
