import { NextResponse } from 'next/server'
import { ensureLedgerTables, getSql } from '@/utils/db'

export const runtime = 'nodejs'

type UpdateBody = {
  status?: string
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

export async function PATCH(
  request: Request,
  { params }: { params: { intentId: string } }
) {
  try {
    const intentId = params.intentId
    if (!intentId) {
      return NextResponse.json({ error: 'Missing intent id' }, { status: 400 })
    }

    const body = (await request.json()) as UpdateBody
    const txHashes = body.txHashes === undefined ? null : JSON.stringify(body.txHashes)

    await ensureLedgerTables()
    const sql = getSql()
    const [swap] = await sql`
      UPDATE swap_intents SET
        status = COALESCE(${body.status ?? null}, status),
        buy_amount_quoted = COALESCE(${body.buyAmountQuoted ?? null}, buy_amount_quoted),
        buy_amount_actual = COALESCE(${body.buyAmountActual ?? null}, buy_amount_actual),
        rfq_id = COALESCE(${body.rfqId ?? null}, rfq_id),
        claim_token = COALESCE(${body.claimToken ?? null}, claim_token),
        expires_at = COALESCE(${body.expiresAt ?? null}, expires_at),
        approval_tx_hash = COALESCE(${body.approvalTxHash ?? null}, approval_tx_hash),
        tx_hashes = COALESCE(${txHashes}::jsonb, tx_hashes),
        submit_ok = COALESCE(${body.submitOk ?? null}, submit_ok),
        error = COALESCE(${body.error ?? null}, error),
        updated_at = NOW()
      WHERE intent_id = ${intentId}
      RETURNING
        intent_id,
        status,
        venue,
        sell_token,
        buy_token,
        tx_hashes,
        submit_ok,
        error,
        updated_at
    `

    if (!swap) {
      return NextResponse.json({ error: 'Swap not found' }, { status: 404 })
    }

    return NextResponse.json({ swap })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not update swap'
    const status = message.includes('Missing DATABASE_URL') ? 503 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
