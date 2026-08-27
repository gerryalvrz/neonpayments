export type SwapIntentCreate = {
  intentId: string
  userAddress: string
  chainId: number
  sellToken: string
  buyToken: string
  sellAmount: string
  venue?: 'textile' | 'mento' | 'squid'
}

export type SwapIntentUpdate = {
  status?: 'created' | 'submitted' | 'confirmed' | 'failed'
  buyAmountQuoted?: string
  buyAmountActual?: string
  rfqId?: string
  claimToken?: string
  expiresAt?: string | null
  approvalTxHash?: string
  txHashes?: string[]
  submitOk?: boolean
  error?: string | null
}

export type TransferCreate = {
  transferId: string
  senderAddress: string
  recipientAddress: string
  chainId: number
  token: string
  amount: string
}

export type TransferUpdate = {
  status: 'created' | 'submitted' | 'confirmed' | 'failed'
  txHash?: string
  error?: string | null
}

export type ActivityItem = {
  id: string
  type: 'swap' | 'send'
  status: 'pending' | 'completed' | 'failed'
  fromToken: string
  toToken: string
  fromAmount: number
  toAmount: number
  hash?: string
  fromAddress?: string
  toAddress?: string
  timestamp: number
  description?: string
}

async function readJson(response: Response) {
  return (await response.json().catch(() => ({}))) as { error?: string }
}

async function requireOk(response: Response, fallback: string) {
  if (response.ok) return
  const body = await readJson(response)
  throw new Error(body.error || fallback)
}

export async function createSwapIntent(input: SwapIntentCreate) {
  const response = await fetch('/api/swaps', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(input),
  })
  await requireOk(response, 'Could not create swap')
}

export async function updateSwapIntent(intentId: string, input: SwapIntentUpdate) {
  const response = await fetch(`/api/swaps/${intentId}`, {
    method: 'PATCH',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(input),
  })
  await requireOk(response, 'Could not update swap')
}

export async function createTransfer(input: TransferCreate) {
  const response = await fetch('/api/transfers', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(input),
  })
  await requireOk(response, 'Could not create transfer')
}

export async function updateTransfer(transferId: string, input: TransferUpdate) {
  const response = await fetch(`/api/transfers/${transferId}`, {
    method: 'PATCH',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(input),
  })
  await requireOk(response, 'Could not update transfer')
}

export async function fetchUserActivity(userAddress: string, limit = 20): Promise<ActivityItem[]> {
  const params = new URLSearchParams({
    userAddress,
    limit: String(limit),
  })
  const response = await fetch(`/api/activity?${params}`, { cache: 'no-store' })
  if (!response.ok) return []
  const body = (await response.json()) as { items?: ActivityItem[] }
  return Array.isArray(body.items) ? body.items : []
}
