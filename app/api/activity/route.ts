import { NextResponse } from 'next/server'
import { ensureLedgerTables, getSql, requireAddress } from '@/utils/db'
import { firstTxHash, humanAmount, ledgerStatusToUi } from '@/utils/activity'
import { reconcileOpenLedger } from '@/utils/reconcile-ledger'
import type { ActivityItem } from '@/utils/intent-logging'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const noStore = { 'Cache-Control': 'private, no-store' }

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userAddress = requireAddress(searchParams.get('userAddress') || '', 'user address')
    const limit = Math.min(Number(searchParams.get('limit') ?? 40), 100)

    await ensureLedgerTables()
    try {
      await reconcileOpenLedger(userAddress)
    } catch (error) {
      console.error('[activity] reconcile', error)
    }

    const sql = getSql()

    const swaps = await sql`
      SELECT
        intent_id,
        user_address,
        status,
        sell_token,
        buy_token,
        sell_amount,
        buy_amount_quoted,
        buy_amount_actual,
        tx_hashes,
        error,
        created_at
      FROM swap_intents
      WHERE user_address = ${userAddress}
        AND status <> 'created'
      ORDER BY created_at DESC
      LIMIT ${limit}
    `

    const transfers = await sql`
      SELECT
        transfer_id,
        sender_address,
        recipient_address,
        status,
        token,
        amount,
        tx_hash,
        error,
        created_at
      FROM transfers
      WHERE sender_address = ${userAddress}
        AND status <> 'created'
      ORDER BY created_at DESC
      LIMIT ${limit}
    `

    const items: ActivityItem[] = []

    for (const row of swaps) {
      const sell = String(row.sell_token)
      const buy = String(row.buy_token)
      const actual = row.buy_amount_actual ? String(row.buy_amount_actual) : String(row.buy_amount_quoted || '0')
      items.push({
        id: String(row.intent_id),
        type: 'swap',
        status: ledgerStatusToUi(String(row.status)),
        fromToken: sell,
        toToken: buy,
        fromAmount: humanAmount(String(row.sell_amount), sell),
        toAmount: humanAmount(actual, buy),
        hash: firstTxHash(row.tx_hashes),
        fromAddress: String(row.user_address),
        timestamp: new Date(String(row.created_at)).getTime(),
        description: row.error ? String(row.error) : undefined,
      })
    }

    for (const row of transfers) {
      const token = String(row.token)
      const amount = humanAmount(String(row.amount), token)
      items.push({
        id: String(row.transfer_id),
        type: 'send',
        status: ledgerStatusToUi(String(row.status)),
        fromToken: token,
        toToken: token,
        fromAmount: amount,
        toAmount: amount,
        hash: typeof row.tx_hash === 'string' ? row.tx_hash : undefined,
        fromAddress: String(row.sender_address),
        toAddress: String(row.recipient_address),
        timestamp: new Date(String(row.created_at)).getTime(),
        description: row.error ? String(row.error) : undefined,
      })
    }

    items.sort((a, b) => b.timestamp - a.timestamp)

    return NextResponse.json({ items: items.slice(0, limit) }, { headers: noStore })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not load activity'
    const status = message.includes('Missing DATABASE_URL') ? 503 : 400
    return NextResponse.json({ error: message, items: [] }, { status, headers: noStore })
  }
}
