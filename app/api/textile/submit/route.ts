import { NextRequest, NextResponse } from 'next/server'
import { submitTextileRfq } from '@/utils/textile/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const id = typeof body.id === 'string' ? body.id.trim() : ''
    const txHash = typeof body.txHash === 'string' ? body.txHash.trim() : ''
    const claimToken = typeof body.claimToken === 'string' ? body.claimToken.trim() : ''

    if (!id || !txHash.startsWith('0x')) {
      return NextResponse.json({ error: 'id and txHash are required' }, { status: 400 })
    }

    if (!claimToken) {
      return NextResponse.json({ error: 'claimToken is required to report the RFQ' }, { status: 400 })
    }

    const result = await submitTextileRfq(id, txHash, claimToken)
    if (!result.ok) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status >= 400 && result.status < 600 ? result.status : 502 }
      )
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[textile/submit]', error)
    return NextResponse.json(
      {
        error: 'Could not report swap',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
