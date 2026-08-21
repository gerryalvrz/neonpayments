import { Contract, JsonRpcProvider, MaxUint256 } from 'ethers'
import { ERC20_ABI, encodeApprove } from '@/utils/wallet/erc20'
import { TEXTILE_LIMIT_ORDER_REACTOR, type TextileUnsignedTx } from './fx'

function rpcUrl() {
  return process.env.NEXT_PUBLIC_CELO_RPC_URL || 'https://forno.celo.org'
}

function toHexValue(value?: string): string {
  if (!value || value === '0') return '0x0'
  if (value.startsWith('0x')) return value
  return `0x${BigInt(value).toString(16)}`
}

export async function waitForCeloTx(hash: string) {
  const provider = new JsonRpcProvider(rpcUrl())
  const receipt = await provider.waitForTransaction(hash)
  if (!receipt || receipt.status === 0) {
    throw new Error('Transaction reverted on Celo')
  }
  return receipt
}

export async function ensureTextileAllowance(params: {
  owner: string
  token: string
  required: bigint
  signTransaction: (tx: { to: string; data: string; value: string }) => Promise<string>
}): Promise<void> {
  const provider = new JsonRpcProvider(rpcUrl())
  const erc = new Contract(params.token, ERC20_ABI, provider)
  const allowance = BigInt((await erc.allowance(params.owner, TEXTILE_LIMIT_ORDER_REACTOR)).toString())
  if (allowance >= params.required) return

  const hash = await params.signTransaction({
    to: params.token,
    data: encodeApprove(TEXTILE_LIMIT_ORDER_REACTOR, MaxUint256),
    value: '0x0',
  })
  await waitForCeloTx(hash)
}

export async function sendTextileTx(
  tx: TextileUnsignedTx,
  signTransaction: (tx: { to: string; data: string; value: string }) => Promise<string>
): Promise<string> {
  const hash = await signTransaction({
    to: tx.to,
    data: tx.data,
    value: toHexValue(tx.value),
  })
  await waitForCeloTx(hash)
  return hash
}
