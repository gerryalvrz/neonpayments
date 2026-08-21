import { RIPIO_WFIAT_CATALOG, RIPIO_WFIAT_DECIMALS, RIPIO_WFIAT_TOKENS } from './ripio'

export interface Token {
  symbol: string
  name: string
  address: string
  decimals: number
  logo: string
  isNative?: boolean
  isStablecoin?: boolean
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
    symbol: 'cUSD',
    name: 'Celo Dollar',
    address: '0x765DE816845861e75A25fCA122bb6898B8B1282a',
    decimals: 18,
    logo: STABLE_LOGO,
    isStablecoin: true,
  },
  {
    symbol: 'USDC',
    name: 'USD Coin',
    address: CELO_USDC,
    decimals: 6,
    logo: STABLE_LOGO,
    isStablecoin: true,
  },
  {
    symbol: 'USDT',
    name: 'Tether USD',
    address: CELO_USDT,
    decimals: 6,
    logo: STABLE_LOGO,
    isStablecoin: true,
  },
  {
    symbol: 'X402',
    name: 'X402 Token',
    address: '0x37290B3f613344Ef22750f732aa9dF846f80DDA0',
    decimals: 18,
    logo: STABLE_LOGO,
  },
  ...RIPIO_WFIAT_CATALOG.map((row) => ({
    symbol: row.symbol,
    name: row.name,
    address: RIPIO_WFIAT_TOKENS[row.symbol],
    decimals: RIPIO_WFIAT_DECIMALS,
    logo: STABLE_LOGO,
    isStablecoin: true,
    isWfiat: true,
  })),
]

export const PAYMENT_SYMBOLS = [
  'cUSD',
  'USDC',
  'USDT',
  'wARS',
  'wBRL',
  'wMXN',
  'wCOP',
  'wPEN',
  'wCLP',
] as const

export type PaymentSymbol = (typeof PAYMENT_SYMBOLS)[number]

export function getToken(symbol: string): Token | undefined {
  return tokens.find((row) => row.symbol === symbol)
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
