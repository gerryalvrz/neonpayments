import { formatUnits } from 'ethers'
import { getToken } from '@/config/tokens'
import { TEXTILE_TOKEN_DECIMALS } from '@/utils/textile/fx'
import type { Transaction } from '@/types'
import type { ActivityItem } from '@/utils/intent-logging'

export function ledgerStatusToUi(status: string): 'pending' | 'completed' | 'failed' {
  if (status === 'confirmed') return 'completed'
  if (status === 'failed') return 'failed'
  return 'pending'
}

export function decimalsForSymbol(symbol: string) {
  if (symbol in TEXTILE_TOKEN_DECIMALS) {
    return TEXTILE_TOKEN_DECIMALS[symbol as keyof typeof TEXTILE_TOKEN_DECIMALS]
  }
  return getToken(symbol)?.decimals ?? 18
}

export function humanAmount(atomic: string | null | undefined, symbol: string) {
  if (!atomic) return 0
  try {
    const value = Number(formatUnits(atomic, decimalsForSymbol(symbol)))
    return Number.isFinite(value) ? value : 0
  } catch {
    return 0
  }
}

export function firstTxHash(value: unknown) {
  if (Array.isArray(value) && typeof value[0] === 'string') return value[0]
  if (typeof value === 'string' && value.startsWith('0x')) return value
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value) as unknown
      if (Array.isArray(parsed) && typeof parsed[0] === 'string') return parsed[0]
    } catch {
      return undefined
    }
  }
  return undefined
}

export function activityToTransaction(item: ActivityItem): Transaction {
  return {
    id: item.id,
    type: item.type === 'send' ? 'send' : 'swap',
    status: item.status,
    fromToken: item.fromToken,
    toToken: item.toToken,
    fromAmount: item.fromAmount,
    toAmount: item.toAmount,
    fromAddress: item.fromAddress,
    toAddress: item.toAddress,
    timestamp: item.timestamp,
    hash: item.hash,
    description: item.description,
  }
}
