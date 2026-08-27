import { Contract, JsonRpcProvider, MaxUint256 } from 'ethers'
import { ERC20_ABI, encodeApprove } from '@/utils/wallet/erc20'
import { recoverBroadcastTxHash } from '@/utils/wallet/recoverTxHash'
import { TEXTILE_LIMIT_ORDER_REACTOR, type TextileUnsignedTx } from './fx'

function rpcUrl() {
  return process.env.NEXT_PUBLIC_CELO_RPC_URL || 'https://forno.celo.org'
}

function toHexValue(value?: string): string {
  if (!value || value === '0') return '0x0'
  if (value.startsWith('0x')) return value
  return `0x${BigInt(value).toString(16)}`
}

async function signedTxHash(
  signTransaction: (tx: { from?: string; to: string; data: string; value: string }) => Promise<string>,
  tx: { from?: string; to: string; data: string; value: string }
) {
  try {
    return await signTransaction(tx)
  } catch (error) {
    const hash = recoverBroadcastTxHash(error)
    if (hash) return hash
    throw error
  }
}

export async function getCeloTxReceipt(hash: string) {
  const provider = new JsonRpcProvider(rpcUrl())
  try {
    return await provider.getTransactionReceipt(hash)
  } catch {
    return null
  }
}

export async function waitForCeloTx(hash: string, timeoutMs = 90_000) {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    try {
      const receipt = await getCeloTxReceipt(hash)
      if (receipt) {
        if (receipt.status === 0) {
          throw new Error('Transaction reverted on Celo')
        }
        return receipt
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes('reverted')) {
        throw error
      }
    }
    await new Promise((resolve) => setTimeout(resolve, 1_200))
  }
  throw new Error('Transaction is still confirming on Celo. Check history in a minute.')
}

export async function ensureTextileAllowance(params: {
  owner: string
  token: string
  required: bigint
  signTransaction: (tx: { from?: string; to: string; data: string; value: string }) => Promise<string>
}): Promise<string | null> {
  const provider = new JsonRpcProvider(rpcUrl())
  const erc = new Contract(params.token, ERC20_ABI, provider)
  const allowance = BigInt((await erc.allowance(params.owner, TEXTILE_LIMIT_ORDER_REACTOR)).toString())
  if (allowance >= params.required) return null

  const hash = await signedTxHash(params.signTransaction, {
    from: params.owner,
    to: params.token,
    data: encodeApprove(TEXTILE_LIMIT_ORDER_REACTOR, MaxUint256),
    value: '0x0',
  })
  await waitForCeloTx(hash)
  return hash
}

export async function sendTextileTx(
  tx: TextileUnsignedTx,
  signTransaction: (tx: { from?: string; to: string; data: string; value: string }) => Promise<string>,
  from?: string,
  onHash?: (hash: string) => Promise<void>
): Promise<string> {
  const hash = await signedTxHash(signTransaction, {
    from,
    to: tx.to,
    data: tx.data,
    value: toHexValue(tx.value),
  })
  if (onHash) await onHash(hash)
  await waitForCeloTx(hash)
  return hash
}
