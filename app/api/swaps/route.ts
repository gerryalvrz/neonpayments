import { NextResponse } from 'next/server'
import { CELO_CHAIN_ID, ensureLedgerTables, getSql, requireAddress } from '@/utils/db'

export const runtime = 'nodejs'

type CreateBody = {
  intentId?: string
  userAddress?: string
  chainId?: number
  sellToken?: string
  buyToken?: string
  sellAmount?: string
  venue?: string
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userAddress = requireAddress(searchParams.get('userAddress') || '', 'user address')
    const limit = Math.min(Number(searchParams.get('limit') ?? 20), 100)
    const offset = Math.max(Number(searchParams.get('offset') ?? 0), 0)

    await ensureLedgerTables()
    const sql = getSql()
    const items = await sql`
      SELECT
        intent_id,
        user_address,
        chain_id,
        status,
        venue,
        sell_token,
        buy_token,
        sell_amount,
        buy_amount_quoted,
        buy_amount_actual,
        rfq_id,
        squid_request_id,
        squid_quote_id,
        expires_at,
        approval_tx_hash,
        tx_hashes,
        submit_ok,
        error,
        created_at,
        updated_at
      FROM swap_intents
      WHERE user_address = ${userAddress}
      ORDER BY created_at DESC
      LIMIT ${limit}
      OFFSET ${offset}
    `

    return NextResponse.json({ items })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not load swaps'
    const status = message.includes('Missing DATABASE_URL') ? 503 : 400
    return NextResponse.json({ error: message }, { status })
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CreateBody
    if (!body.intentId || !body.sellToken || !body.buyToken || !body.sellAmount) {
      return NextResponse.json({ error: 'Missing swap intent fields' }, { status: 400 })
    }

    const userAddress = requireAddress(body.userAddress, 'user address')
    const chainId = body.chainId || CELO_CHAIN_ID
    const venue =
      body.venue === 'squid' || body.venue === 'mento' ? body.venue : 'textile'

    await ensureLedgerTables()
    const sql = getSql()
    const [swap] = await sql`
      INSERT INTO swap_intents (
        intent_id,
        user_address,
        chain_id,
        status,
        venue,
        sell_token,
        buy_token,
        sell_amount
      )
      VALUES (
        ${body.intentId},
        ${userAddress},
        ${chainId},
        'created',
        ${venue},
        ${body.sellToken},
        ${body.buyToken},
        ${body.sellAmount}
      )
      ON CONFLICT (intent_id) DO UPDATE SET
        updated_at = NOW()
      RETURNING intent_id, status, venue
    `

    return NextResponse.json({ swap })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not create swap'
    const status = message.includes('Missing DATABASE_URL') ? 503 : 400
    return NextResponse.json({ error: message }, { status })
  }
}
