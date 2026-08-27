import postgres from 'postgres'
import { isValidCeloAddress } from '@/config/ripio'

export type LedgerStatus = 'created' | 'submitted' | 'confirmed' | 'failed'
export type SwapVenue = 'textile' | 'mento' | 'squid'

type GlobalSql = {
  neonpaySql?: postgres.Sql
  neonpayTables?: Promise<void>
}

const g = globalThis as typeof globalThis & GlobalSql

export const CELO_CHAIN_ID = 42220

export function normalizeAddress(value: string) {
  return value.trim().toLowerCase()
}

export function requireAddress(value: string | undefined, label: string) {
  if (!value || !isValidCeloAddress(value)) {
    throw new Error(`Invalid ${label}`)
  }
  return normalizeAddress(value)
}

export function getSql() {
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) {
    throw new Error('Missing DATABASE_URL')
  }
  if (!g.neonpaySql) {
    const local = /localhost|127\.0\.0\.1/i.test(databaseUrl)
    const pooled = /pooler\.supabase\.com|:6543\b/i.test(databaseUrl)
    g.neonpaySql = postgres(databaseUrl, {
      max: 1,
      idle_timeout: 20,
      connect_timeout: 10,
      ssl: local ? false : 'require',
      ...(pooled ? { prepare: false } : {}),
    })
  }
  return g.neonpaySql
}

export async function ensureLedgerTables() {
  if (!g.neonpayTables) {
    g.neonpayTables = (async () => {
      const sql = getSql()
      await sql`
        CREATE TABLE IF NOT EXISTS swap_intents (
          intent_id TEXT PRIMARY KEY,
          user_address TEXT NOT NULL,
          chain_id INTEGER NOT NULL,
          status TEXT NOT NULL,
          venue TEXT NOT NULL DEFAULT 'textile',
          sell_token TEXT NOT NULL,
          buy_token TEXT NOT NULL,
          sell_amount TEXT NOT NULL,
          buy_amount_quoted TEXT,
          buy_amount_actual TEXT,
          rfq_id TEXT,
          claim_token TEXT,
          squid_request_id TEXT,
          squid_quote_id TEXT,
          expires_at TIMESTAMPTZ,
          approval_tx_hash TEXT,
          tx_hashes JSONB NOT NULL DEFAULT '[]'::jsonb,
          submit_ok BOOLEAN,
          error TEXT,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `
      await sql`
        CREATE INDEX IF NOT EXISTS swap_intents_user_created_idx
        ON swap_intents (user_address, created_at DESC)
      `
      await sql`
        CREATE TABLE IF NOT EXISTS transfers (
          transfer_id TEXT PRIMARY KEY,
          sender_address TEXT NOT NULL,
          recipient_address TEXT NOT NULL,
          chain_id INTEGER NOT NULL,
          status TEXT NOT NULL,
          token TEXT NOT NULL,
          amount TEXT NOT NULL,
          tx_hash TEXT,
          error TEXT,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `
      await sql`
        CREATE INDEX IF NOT EXISTS transfers_sender_created_idx
        ON transfers (sender_address, created_at DESC)
      `
    })().catch((error) => {
      g.neonpayTables = undefined
      throw error
    })
  }
  await g.neonpayTables
}
