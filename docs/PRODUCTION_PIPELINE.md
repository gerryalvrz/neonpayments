# NeonPay MX — Production pipeline spec

Copied from COP By’s execution ledger (`Cop-BY/cop_by`), adapted to this repo.
Do **not** copy Mento COPm as the product output, agent contracts, or the partner API.

**Venues:** Textile FX is v1 (already live). Squid Router is an **after** slice (P6): copy COP By’s working v2 client to turn mixed MiniPay balances into USDT. Squid does not replace Textile.

**Goal:** a MiniPay user can complete a real money movement, kill the app, reopen it, and still see that tx. Support can find it by wallet + intent id.

**Source of truth for later slices:** this file. Implementation PRs should name the slice (`P0`–`P6`) and check the acceptance criteria below.

Related: [COP By repo](https://github.com/Cop-BY/cop_by) · comparison canvases are in the Cursor project, not this repo.

---

## 1. What we copy vs skip

| COP By piece | Decision | NeonPay mapping |
| --- | --- | --- |
| `swap_intents` + `copm_transfers` in Postgres | **Copy** | `swap_intents` + `transfers`. Vendor is Postgres (`DATABASE_URL`); Neon or Supabase both fine. |
| Create row **before** the user signs | **Copy** | Textile swap and ERC-20 send first. |
| PATCH hash the moment the wallet returns it | **Copy** | Status `submitted` even if Textile submit or UI dies. |
| Confirm from chain + venue, then store actual output | **Copy** | `waitForCeloTx` + `POST /api/textile/submit` + balance delta / logs. |
| Activity from `GET` APIs, not React state | **Copy** | Replace `AppContext.transactions` as source of truth. |
| Friendly wallet error map | **Copy** | EN/ES. Never show raw ethers/viem dumps. |
| MiniPay recipient fallback (swap to self, then transfer) | **Adapt** | Only if we add buy-and-send. Textile RFQ `taker` is the connected wallet today. |
| Shareable receipt + saved recipients (max 5) | **Adapt** | After send/swap confirm. PDF in MiniPay; image elsewhere. |
| ERC-8021 Celo attribution suffix | **Later (P5)** | Append on every swap/send calldata. Not blocking UX. |
| Product freeze: one job, hide mocks | **Copy as rule** | See §3. |
| CI type-check on PR | **Copy (P5)** | This repo has no `.github/workflows`. |
| Squid v2 route + status poll (`squid-config.ts`) | **Later (P6)** | Same intent ledger. Job: any liquid token → USDT (Textile input). Not a Textile replacement. |
| Ordered multi-token spend | **Later (P6b)** | Only after a **single** Squid pair (e.g. USDC→USDT) confirms on MiniPay. |
| Squid integrator fee (25 bps) | **Later (P6)** | Needs our own `NEXT_PUBLIC_SQUID_INTEGRATOR_ID`. Do not reuse COP By’s id. |
| `CopByPurchaseLog` + logger private key | **Skip until needed** | DB + Celoscan is enough for v1 support. |
| `CopByFXExecutor`, agent registry, EIP-7702, partner prepare/confirm API | **Skip** | Colombia distribution, not MX MiniPay. |

---

## 2. Current gaps this spec closes

Existing live path (keep):

- Wallet adapters: MiniPay / Privy / thirdweb / WaaP — `utils/wallet/`
- Textile RFQ: `app/api/textile/quote`, `swap`, `submit` + `utils/textile/`
- Firm-quote expiry retry in `components/Swap/SwapScreen.tsx`
- Onchain send in `components/Send/SendScreen.tsx` via `wallet.sendToken`
- Receipt wait: `waitForCeloTx` in `utils/textile/execute.ts`

Broken for production:

- Success is `addTransaction(...)` into `AppContext` (in-memory). Reload wipes history (`components/Transactions/TransactionHistoryScreen.tsx` reads context only).
- Non-Textile pairs still call `mockTx` and mark the swap completed.
- `POST /api/textile/submit` after a mined hash can fail with no durable record.
- Send does not wait for a receipt before `status: 'completed'`.
- User reject / revert is a toast; no `failed` row.
- Mercado Pago webhook (`app/api/mercado-pago/webhook/route.ts`) echoes and never credits.
- Transak top-up is mock end-to-end.
- Squid is still `mockGetSwapQuote` / `mockExecuteSwap` in `utils/mockApi.ts` (old v1 SDK comment). COP By’s live client is `https://v2.api.squidrouter.com`.

---

## 3. P0 — Product freeze

Production path is **only**:

1. Connect wallet (MiniPay auto-connect; standalone picker).
2. Swap a **live Textile pair** (`wARS`/`wBRL` ↔ `USDT`).
3. Send a listed payment token to an address / CNS / QR.

Hide or hard-disable on the critical path (do not mock-complete):

- Indicative / mocked Squid swaps (USDC/cUSD/USDT among themselves, wMXN, etc.) until **P6** ships a real route
- Transak card top-up
- Mexico bill-pay / services
- x402
- Mercado Pago **credit** (OAuth connect may stay; funding must not fake USDC)

**Open product decision (block P4 and wMXN-on-Squid, not P1):** Textile has no wMXN corridor today. Mento has no MXN token (cMXP was a proposal). v1 converter is ARS/BRL ↔ USDT, or USDC send with MXN as display FX. Do not persist “buy wMXN” until Textile opens that pair **or** Squid returns a live Uniswap route to `wMXN` (prove with a quote, then allow the pair).

Copy COP By’s UX rule: one job, few taps, pesos/MXN-first copy in MiniPay, Spanish default when `wallet.isMiniPay`.

---

## 4. Intent lifecycle (the pattern)

Never treat a money movement as done because the wallet returned a hash.

```
create intent          status = created
        │
        ▼
user signs (approve and/or swap/send)
        │
        ▼
PATCH tx hash          status = submitted     ← durable even if UI dies
        │
        ▼
wait receipt + venue
        │
   ┌────┴────┐
   ▼         ▼
confirmed   failed
   │
   ▼
GET /api/activity      (source of truth)
```

Status vocabulary (keep these strings; support greps one language):

| Status | Meaning |
| --- | --- |
| `created` | Row exists. User has not produced a tx hash yet. |
| `submitted` | At least one tx hash stored. Chain/venue not confirmed. |
| `confirmed` | Receipt `status == 1` and venue accept (Textile submit ok, Squid status success, or send needs no venue). Actual output stored when known. |
| `failed` | User reject, revert, expired quote, or venue reject. `error` column set. |

Do **not** reuse the UI type `TransactionStatus` (`pending` / `completed` / …) on the ledger. Map at the activity API: `submitted` → pending, `confirmed` → completed.

### 4.1 Swap (Textile) — hook points

File: `components/Swap/SwapScreen.tsx` `handleConfirm`.

1. If `resolveTextilePair` is null → **refuse**. No `mockTx`.
2. `POST /api/swaps` with `intentId` (UUID), `userAddress`, `sellToken`, `buyToken`, `sellAmount`. Status `created`. Do this **before** `ensureTextileAllowance`.
3. Approve if needed. If approve sends a tx, append that hash (optional `approval_tx_hash`).
4. Firm RFQ (`POST /api/textile/swap`). Store `rfq_id`, `claim_token`, `buy_amount_quoted`, `expires_at` on the row (PATCH). Keep existing expiry retry.
5. `sendTextileTx`. On hash: PATCH `submitted` + `tx_hashes`.
6. `waitForCeloTx`. On revert: PATCH `failed`.
7. `POST /api/textile/submit`. Persist submit ok/fail. Retry once on 5xx.
8. Measure `buy_amount_actual` (balance delta of `buyToken` for `userAddress`, else quoted).
9. PATCH `confirmed`. Then show success. Activity reads the row, not `addTransaction`.

If the user rejects the wallet prompt: PATCH `failed` with a friendly error, stay on review.

### 4.2 Send — hook points

File: `components/Send/SendScreen.tsx` `handleConfirm`.

1. `POST /api/transfers` (`created`) before `wallet.sendToken`.
2. On hash: PATCH `submitted` + `tx_hash`.
3. `waitForCeloTx`. Success → `confirmed`. Revert/reject → `failed`.
4. Do not mark completed from the progress animation.

### 4.3 Swap (Squid) — P6 only

Do not start until P2 Textile confirm/fail is durable. Copy COP By `apps/web/src/lib/squid-config.ts`, do not revive `mockGetSwapQuote`.

Default P6 job: **USDC → USDT** (and then cUSD/USDm → USDT if that quote works). Output is USDT so the user can hit Textile. Not COPm.

1. If `resolveTextilePair` matches → stay on §4.1. Squid is the fallback for pairs Textile does not serve.
2. `POST /api/swaps` with `venue: 'squid'` **before** approve. Same status machine as Textile.
3. Quote: `POST https://v2.api.squidrouter.com/v2/route` with token **addresses**, atomic `fromAmount`, `fromChain`/`toChain` `42220`, `x-integrator-id`. Prefer `["Uniswap V3"]`; on liquidity errors retry without `prefer` (COP By `getSquidCopmRoute`).
4. Approve Squid `approvalTarget` if needed. Store `approval_tx_hash`.
5. Send `transactionRequest` (append attribution in P5+). PATCH `submitted` + hash. Store `squid_request_id` / `quote_id` (not `claim_token`).
6. `waitForCeloTx`, then poll Squid `/v2/status` (COP By `waitForSquidStatus`, ~10 × 3s). `success` / `partial_success` → measure output → `confirmed`. Else `failed`.
7. MiniPay buy-and-send: if `toAddress` cannot be a third party, swap to self then transfer (COP By `usesMiniPayRecipientFallback`).

P6b (ordered spend across several balances) only after one pair has confirmed on MiniPay.

---

## 5. Schema

Postgres. Create tables in a server helper (COP By style `ensure*Table` is acceptable for v1; a real migration later is better). Amounts are **strings of human or atomic units consistently** — store **atomic integers as text** plus `decimals` to avoid float (`fromAmount: number` in `types/Transaction` is the old mock).

### `swap_intents`

```text
intent_id           TEXT PRIMARY KEY          -- uuid
user_address        TEXT NOT NULL             -- lowercase 0x
chain_id            INTEGER NOT NULL          -- 42220
status              TEXT NOT NULL             -- created|submitted|confirmed|failed
venue               TEXT NOT NULL DEFAULT 'textile'  -- textile|squid
sell_token          TEXT NOT NULL             -- symbol, e.g. USDT
buy_token           TEXT NOT NULL
sell_amount         TEXT NOT NULL             -- atomic
buy_amount_quoted   TEXT
buy_amount_actual   TEXT
rfq_id              TEXT                      -- textile
claim_token         TEXT                      -- textile; do not expose in GET activity
squid_request_id    TEXT                      -- squid
squid_quote_id      TEXT                      -- squid
expires_at          TIMESTAMPTZ
approval_tx_hash    TEXT
tx_hashes           JSONB NOT NULL DEFAULT '[]'
submit_ok           BOOLEAN
error               TEXT
created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
```

Index: `(user_address, created_at DESC)`.

### `transfers`

```text
transfer_id         TEXT PRIMARY KEY
sender_address      TEXT NOT NULL
recipient_address   TEXT NOT NULL
chain_id            INTEGER NOT NULL
status              TEXT NOT NULL
token               TEXT NOT NULL             -- symbol
amount              TEXT NOT NULL             -- atomic
tx_hash             TEXT
error               TEXT
created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
```

Index: `(sender_address, created_at DESC)`.

Env: `DATABASE_URL` (server only). Never `NEXT_PUBLIC_`.

P6 also needs `NEXT_PUBLIC_SQUID_INTEGRATOR_ID` (Squid-issued for this app). Optional `NEXT_PUBLIC_SQUID_PREFER_DEX` (default `Uniswap V3`).

---

## 6. API contracts

Mirror COP By’s `lib/swap-logging.ts` + `app/api/swaps` / `transfers`, renamed.

| Method | Path | Role |
| --- | --- | --- |
| `POST` | `/api/swaps` | Create intent. Body: `intentId`, `userAddress`, `chainId`, `sellToken`, `buyToken`, `sellAmount`, optional `venue` (`textile` default). |
| `PATCH` | `/api/swaps/:intentId` | Update status, hashes, quoted/actual, rfq or squid ids, error. |
| `GET` | `/api/swaps?userAddress=&limit=&offset=` | Wallet history. Omit `claim_token`. |
| `POST` | `/api/transfers` | Create. Body: `transferId`, `senderAddress`, `recipientAddress`, `chainId`, `token`, `amount`. |
| `PATCH` | `/api/transfers/:transferId` | Status, `txHash`, error. |
| `GET` | `/api/transfers?senderAddress=` | Send history. |
| `GET` | `/api/activity?userAddress=` | Merge swaps + transfers, newest first. Used by `/transactions` and home recent list. |

Rules:

- Validate addresses with checksum/hex. Store lowercase.
- `GET` is public-by-address (same as COP By). Do not add auth in P1; MiniPay has no session cookie. Do not return `claim_token`. Squid ids on GET are fine.
- PATCH is not authenticated in P1 (COP By is the same). Do not expand this to admin mutations.
- Idempotent create: `ON CONFLICT (intent_id) DO UPDATE SET updated_at = NOW()`.

Client helper (new): `utils/intent-logging.ts` — `createSwapIntent`, `updateSwapIntent`, `createTransfer`, `updateTransfer`, `fetchUserActivity`. Fire-and-forget is **not** allowed for create-before-sign or hash PATCH; those must `await` and fail the flow if the API is down (better to block than to sign a ghost tx). Activity fetch may fail soft.

---

## 7. Activity UI

- `components/Transactions/TransactionHistoryScreen.tsx` and home “recent” read `GET /api/activity` keyed by `wallet.address`.
- Stop using `AppContext.transactions` / `addTransaction` for swap and send. Leave the context field only if other screens still push mocks; those screens are off the production path (P0).
- Map ledger status → existing badges: `submitted` pending, `confirmed` completed, `failed` failed.
- Link `tx_hash` / last `tx_hashes[]` to Celoscan (`https://celoscan.io/tx/...`).

---

## 8. Friendly errors

New helper e.g. `utils/errors.ts` — `friendlyError(error, lang, context: 'swap' | 'send')`.

Map at least:

| Signal | EN | ES |
| --- | --- | --- |
| user rejected / denied | You cancelled the confirmation in your wallet. | Cancelaste la confirmación en tu wallet. |
| insufficient funds / allowance | Not enough balance or token permission. | Saldo o permiso insuficiente. |
| 429 / rate limit | Too many quotes. Wait a few seconds. | Demasiadas cotizaciones. Espera unos segundos. |
| quote expiry / too close | Firm quote expired (~30s). Confirm again. | La cotización firme expiró (~30 s). Confirma de nuevo. |
| no_quote / no_makers | Textile has no quote on this pair right now. | Textile no tiene cotización en este par ahora. |
| no route / low liquidity (P6) | Not enough liquidity to swap this pair. Try a smaller amount. | No hay liquidez suficiente para este par. Prueba un monto menor. |
| squid route unavailable (P6) | Could not get a Squid quote. Try again. | No pudimos obtener una cotización de Squid. Intenta de nuevo. |
| revert | The transaction reverted on Celo. | La transacción falló en Celo. |
| default (long / dump) | We could not complete this. Check the wallet prompt and try again. | No pudimos completar esto. Revisa la wallet e intenta de nuevo. |

Never toast `request arguments` or 200+ char RPC blobs (COP By truncates).

---

## 9. MiniPay adaptations (when we need them)

Not required for P1 Textile self-swap. Required before buy-and-send:

- If MiniPay cannot set RFQ `taker` or Squid `toAddress` to a third party, swap into the connected wallet, confirm output, then ERC-20 transfer (COP By `usesMiniPayRecipientFallback`). Textile self-swap does not need this. Squid buy-and-send does.
- Receipts: `html-to-image` is flaky in MiniPay; prefer PDF (`jspdf`) there.
- Default language `es` when `wallet.isMiniPay`.

---

## 10. Slices and acceptance criteria

Implement in this order: **P0 → P1 → P2**, then P3 / P6 / P4 / P5 as needed. P6 must not start before P2. Each slice is its own spec/PR. This file stays the parent.

### P0 — Freeze

- [ ] Swap confirm throws if the pair is not Textile live; no `mockTx`.
- [ ] Top-up Transak tab hidden or labelled unavailable.
- [ ] Services / x402 not reachable from home quick actions (or behind a non-prod flag).
- [ ] MiniPay onboarding: connect → swap or send. No mock success screens on those two.
- [ ] Do not enable Squid in the UI. Non-Textile pairs stay refused (not mocked).

### P1 — Ledger

- [ ] `DATABASE_URL` wired. Tables created.
- [ ] Swap: create → hash PATCH → confirm/fail as in §4.1.
- [ ] Send: same as §4.2.
- [ ] Kill MiniPay after `submitted`; reopen `/transactions` shows the pending/confirmed row.
- [ ] User reject writes `failed`, not a silent toast-only.
- [ ] `claim_token` never appears in GET JSON.

### P2 — Harden Textile

- [ ] Existing expiry retry kept.
- [ ] Submit retried once on 5xx; failure after mined tx is `submitted` with `submit_ok=false` and visible warning, not fake `confirmed`.
- [ ] `buy_amount_actual` from balance delta when possible.
- [ ] Friendly errors on swap UI.

### P3 — Send polish

- [ ] Receipt wait before `confirmed`.
- [ ] Saved recipients (max 5, localStorage ok).
- [ ] Shareable receipt after success (adapt COP By `shareable-receipt`).

### P6 — Squid, any token → USDT (after P2)

May run in parallel with P3–P5. Must **not** start before P1+P2 (ledger + Textile confirm). Does not replace Textile: Textile pairs still use §4.1.

Copy from COP By: `apps/web/src/lib/squid-config.ts`, `waitForSquidStatus`, Uniswap V3 prefer + fallback, MiniPay recipient fallback. Do not copy COPm as the default `toToken` or their integrator id.

- [ ] Delete `mockGetSwapQuote` / `mockExecuteSwap` from the swap path. Quotes go to Squid v2.
- [ ] First enabled pair: USDC → USDT on Celo `42220`. Quote must return a `transactionRequest`.
- [ ] Same intent row as Textile (`venue: 'squid'`). Create before approve; PATCH hash; confirm after receipt + Squid status.
- [ ] Reload MiniPay still shows the swap. Celoscan link works.
- [ ] Liquidity miss shows the friendly “no liquidity” copy, not a mock fill.
- [ ] Own `NEXT_PUBLIC_SQUID_INTEGRATOR_ID`. Integrator fee visible if Squid returns `feeCosts`.
- [ ] **P6b (separate PR):** ordered spend across several balances only after the single pair is confirmed in MiniPay.
- [ ] **wMXN on Squid:** allow only after a production quote succeeds for Ripio `wMXN`. Do not assume Uniswap has that pool.

### P4 — Onramp (original work; COP By has no analog)

- [ ] Mercado Pago webhook creates/updates a **payment intent** row.
- [ ] `confirmed` only when on-chain USDC (or documented credit) is observed.
- [ ] No mock Transak complete.

### P5 — Hygiene

- [ ] GitHub Action: `lint` + `tsc` on PR.
- [ ] Optional: `@celo/attribution-tags` suffix on swap/send data.
- [ ] Optional later: public purchase log contract. Not a launch blocker.

---

## 11. Anchor files

When implementing, touch these first:

| Area | Files |
| --- | --- |
| Swap execute | `components/Swap/SwapScreen.tsx` |
| Send execute | `components/Send/SendScreen.tsx` |
| Receipt wait | `utils/textile/execute.ts` (`waitForCeloTx`) |
| Textile venue | `app/api/textile/swap/route.ts`, `submit/route.ts`, `utils/textile/server.ts` |
| Squid venue (P6) | New `lib/squid-config.ts` (copy COP By v2 client). SwapScreen routes non-Textile pairs here. |
| History UI | `components/Transactions/TransactionHistoryScreen.tsx`, `components/Home/HomeScreen.tsx` |
| Mock to delete from prod path | `utils/mockApi.ts` (`mockGetSwapQuote`, `mockExecuteSwap`), `mockTx` in SwapScreen |
| New | `utils/db.ts`, `utils/intent-logging.ts`, `app/api/swaps/**`, `app/api/transfers/**`, `app/api/activity/route.ts`, `utils/errors.ts` |

---

## 12. Explicitly out of scope

- Replacing Textile with Squid. Both venues share the intent ledger; Textile keeps wARS/wBRL ↔ USDT.
- Shipping Squid before P2 (no mock Squid “success”).
- Defaulting Squid output to Mento COPm (Colombia product, not ours).
- Ordered multi-token spend in the first Squid PR (that is P6b).
- Enabling wMXN (or COPm) on Squid without a live quote.
- Own Solidity (purchase log, 7702 executor).
- Partner integrations API.
- Auth on PATCH (follow-up threat model).
- Replacing the four wallet providers.

---

## 13. Definition of production-ready (v1)

A MiniPay user on Celo mainnet can:

1. Swap a live Textile pair and/or send USDC.
2. Reload the miniapp and see that tx with a Celoscan link.
3. Cancel a signature and see a human error, not a crash.
4. Never complete a swap/send through a mock.

Mercado Pago funding, bill pay, x402, and Squid are **not** required for v1.

**v1.1 (P6):** same bar for USDC → USDT via Squid v2, still without mock fills. Textile remains the FX rail.
