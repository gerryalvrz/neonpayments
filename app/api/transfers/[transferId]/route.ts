import { NextResponse } from 'next/server'
import { ensureLedgerTables, getSql } from '@/utils/db'

export const runtime = 'nodejs'

type UpdateBody = {
  status?: string
  txHash?: string
  error?: string | null
}

export async function PATCH(
  request: Request,
  { params }: { params: { transferId: string } }
) {
  try {
    const transferId = params.transferId
    if (!transferId) {
      return NextResponse.json({ error: 'Missing transfer id' }, { status: 400 })
    }

    const body = (await request.json()) as UpdateBody
    await ensureLedgerTables()
    const sql = getSql()
    const [transfer] = await sql`
      UPDATE transfers SET
        status = COALESCE(${body.status ?? null}, status),
        tx_hash = COALESCE(${body.txHash ?? null}, tx_hash),
        error = COALESCE(${body.error ?? null}, error),
        updated_at = NOW()
      WHERE transfer_id = ${transferId}
      RETURNING transfer_id, status, tx_hash, error, updated_at
    `

    if (!transfer) {
      return NextResponse.json({ error: 'Transfer not found' }, { status: 404 })
    }

    return NextResponse.json({ transfer })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not update transfer'
    const status = message.includes('Missing DATABASE_URL') ? 503 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
