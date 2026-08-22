import { getSql } from '@/utils/db'
import { firstTxHash } from '@/utils/activity'
import { getCeloTxReceipt } from '@/utils/textile/execute'
import { submitTextileRfq } from '@/utils/textile/server'

const MAX_OPEN = 5

export async function reconcileOpenLedger(userAddress: string) {
  const sql = getSql()

  const swaps = await sql`
    SELECT
      intent_id,
      venue,
      rfq_id,
      claim_token,
      tx_hashes,
      buy_amount_quoted,
      buy_amount_actual
    FROM swap_intents
    WHERE user_address = ${userAddress}
      AND status = 'submitted'
    ORDER BY created_at DESC
    LIMIT ${MAX_OPEN}
  `

  for (const row of swaps) {
    const hash = firstTxHash(row.tx_hashes)
    if (!hash) continue
    const receipt = await getCeloTxReceipt(hash)
    if (!receipt) continue
    if (receipt.status === 0) {
      await sql`
        UPDATE swap_intents SET
          status = 'failed',
          error = 'Transaction reverted on Celo',
          updated_at = NOW()
        WHERE intent_id = ${String(row.intent_id)}
          AND status = 'submitted'
      `
      continue
    }

    let submitOk = String(row.venue) !== 'textile'
    if (String(row.venue) === 'textile' && row.rfq_id && row.claim_token) {
      const result = await submitTextileRfq(
        String(row.rfq_id),
        hash,
        String(row.claim_token)
      )
      submitOk = result.ok
    }

    const actual = row.buy_amount_actual || row.buy_amount_quoted || null
    if (submitOk) {
      await sql`
        UPDATE swap_intents SET
          status = 'confirmed',
          submit_ok = TRUE,
          buy_amount_actual = COALESCE(${actual}, buy_amount_actual),
          error = NULL,
          updated_at = NOW()
        WHERE intent_id = ${String(row.intent_id)}
          AND status = 'submitted'
      `
    } else {
      await sql`
        UPDATE swap_intents SET
          submit_ok = FALSE,
          buy_amount_actual = COALESCE(${actual}, buy_amount_actual),
          error = COALESCE(error, 'Venue report failed after the transaction was mined'),
          updated_at = NOW()
        WHERE intent_id = ${String(row.intent_id)}
          AND status = 'submitted'
      `
    }
  }

  const transfers = await sql`
    SELECT transfer_id, tx_hash
    FROM transfers
    WHERE sender_address = ${userAddress}
      AND status = 'submitted'
      AND tx_hash IS NOT NULL
    ORDER BY created_at DESC
    LIMIT ${MAX_OPEN}
  `

  for (const row of transfers) {
    const hash = typeof row.tx_hash === 'string' ? row.tx_hash : null
    if (!hash) continue
    const receipt = await getCeloTxReceipt(hash)
    if (!receipt) continue
    if (receipt.status === 0) {
      await sql`
        UPDATE transfers SET
          status = 'failed',
          error = 'Transaction reverted on Celo',
          updated_at = NOW()
        WHERE transfer_id = ${String(row.transfer_id)}
          AND status = 'submitted'
      `
      continue
    }
    await sql`
      UPDATE transfers SET
        status = 'confirmed',
        error = NULL,
        updated_at = NOW()
      WHERE transfer_id = ${String(row.transfer_id)}
        AND status = 'submitted'
    `
  }
}
