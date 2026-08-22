import { NextResponse } from 'next/server'
import { CELO_CHAIN_ID, ensureLedgerTables, getSql, requireAddress } from '@/utils/db'

export const runtime = 'nodejs'

type CreateBody = {
  transferId?: string
  senderAddress?: string
  recipientAddress?: string
  chainId?: number
  token?: string
  amount?: string
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const senderAddress = requireAddress(
      searchParams.get('senderAddress') || searchParams.get('userAddress') || '',
      'sender address'
    )
    const limit = Math.min(Number(searchParams.get('limit') ?? 20), 100)
    const offset = Math.max(Number(searchParams.get('offset') ?? 0), 0)

    await ensureLedgerTables()
    const sql = getSql()
    const items = await sql`
      SELECT
        transfer_id,
        sender_address,
        recipient_address,
        chain_id,
        status,
        token,
        amount,
        tx_hash,
        error,
        created_at,
        updated_at
      FROM transfers
      WHERE sender_address = ${senderAddress}
      ORDER BY created_at DESC
      LIMIT ${limit}
      OFFSET ${offset}
    `

    return NextResponse.json({ items })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not load transfers'
    const status = message.includes('Missing DATABASE_URL') ? 503 : 400
    return NextResponse.json({ error: message }, { status })
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CreateBody
    if (!body.transferId || !body.token || !body.amount) {
      return NextResponse.json({ error: 'Missing transfer fields' }, { status: 400 })
    }

    const senderAddress = requireAddress(body.senderAddress, 'sender address')
    const recipientAddress = requireAddress(body.recipientAddress, 'recipient address')
    const chainId = body.chainId || CELO_CHAIN_ID

    await ensureLedgerTables()
    const sql = getSql()
    const [transfer] = await sql`
      INSERT INTO transfers (
        transfer_id,
        sender_address,
        recipient_address,
        chain_id,
        status,
        token,
        amount
      )
      VALUES (
        ${body.transferId},
        ${senderAddress},
        ${recipientAddress},
        ${chainId},
        'created',
        ${body.token},
        ${body.amount}
      )
      ON CONFLICT (transfer_id) DO UPDATE SET
        updated_at = NOW()
      RETURNING transfer_id, status
    `

    return NextResponse.json({ transfer })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not create transfer'
    const status = message.includes('Missing DATABASE_URL') ? 503 : 400
    return NextResponse.json({ error: message }, { status })
  }
}
