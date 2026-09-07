# SDD — Agent envelope (capped spend + revoke)

**Repo:** NeonPay (`neonpayments`). This is the hackathon submission and the product surface.  
**Not the submission:** Prism Protocol, a new repo, a corridor SDK, Solana.

**One-liner:** A MiniPay (or web) human in **NeonPay** gives an ERC-8004 agent a capped pile of **wMXN** they can **revoke**.

**Contest:** [Celo Agents at Work](https://celoplatform.notion.site/Agents-at-Work-Hackathon-3c1d5cb803de81139de7f4f3d09e55dc) · 28 Aug–14 Sep 2026 09:00 GMT · **Celo mainnet only**.  
**Primary track:** `judges-favorite`. Optional one-liner for stablecoin adoption if independent MiniPay wallets actually receive wMXN.

**Related:** [PRODUCTION_PIPELINE.md](./PRODUCTION_PIPELINE.md) (send/swap ledger). This feature **adds** an envelope; it does not replace P0 send/swap. Envelope **fund** is still a **transfer** of wMXN the user already holds (receive, or swap on the live Textile `wMXN` ↔ `USDT` desk then transfer). Do **not** invent a second buy path inside the envelope slice.

Implementation PRs should name the slice (`S0`–`S8`) and check the AC below.

---

## 1. Purpose

People want a bot to **pay for them** without giving it MiniPay.

| Actor | Role |
| --- | --- |
| Human | Opens **NeonPay** (MiniPay WebView or desktop wallet-embed). Owns wMXN in their connected wallet. |
| NeonPay UI | Enable / Fund / Revoke. Never a second MiniPay app. |
| Envelope | On-chain box: spending cap, optional daily cap, TTL, delegate = agent. |
| Agent | Separate process + **its own Celo key**. ERC-8004 identity. Cannot use `window.ethereum`. Calls `execute` / transfer from the envelope only. |
| MiniPay | Door: injected `window.ethereum.isMiniPay`. Not an agent runtime. |

**Pitch (do not say “extension”):** Capped agent spend, with a kill switch.

---

## 2. Non-goals (until after 14 Sep)

- Canonical Self-nullifier root / shared balance across Privy vs MiniPay vs WaaP  
- `npm` EVM SDK, `@celo-corridor/*`, Transak/MoonPay adapters  
- Chrome inject / “log into Uniswap as a context”  
- Agents running inside MiniPay  
- Solana Prism  
- New GitHub repo (attribution tag locks to `owner/repo` at first registration save)

---

## 3. User journey (hackathon demo)

```text
1. Open NeonPay in MiniPay (or web + connect).
2. Hold wMXN in the connected wallet
   (Ripio 0x337E7456B420bD3481e7FA61fA9850343d610d34).
3. Settings → Agents → Enable
   cap e.g. 50 wMXN / tx, 200 / day, 7-day TTL, delegate = agent address.
4. Fund: send wMXN from human wallet → envelope.
5. Agent runner sends 10 wMXN to a second Celo address (tagged).
6. Human taps Revoke. Agent send #2 reverts.
```

Interface is **always NeonPay**. MiniPay vs web is only how the signer is attached (`packages/wallet-embed`).

---

## 4. Architecture

```text
Human signer (MiniPay inject | Privy | thirdweb | WaaP)
        │
        ▼
   NeonPay UI  (app/ + components/)
        │  enable / fund / revoke
        ▼
   Envelope (PrismContext via Factory V2  OR  minimal allowance in this repo)
        │  only delegate can spend; owner can revoke
        ▼
   Agent process  (scripts/agent-envelope.ts)
        │  own key, ERC-8004, ERC-8021 tag
        ▼
   Recipient  (independent Celo address — not a wallet we funded this window)
```

**Contracts (prefer existing Celo deploy if it fits in S2):**

| Piece | Address / note |
| --- | --- |
| PrismFactory V2 | `0x21a7d7A3D28750961321479f57596dd58520521F` |
| Official ERC-8004 Identity | `0x8004A169FB4a3325136EB29fA0ceB6D2e539a432` |
| wMXN | `0x337E7456B420bD3481e7FA61fA9850343d610d34` |
| Chain | Celo `42220` |

If Factory `createContext` + ERC-20 `execute` is slower than two days, S2 ships a **minimal** `AgentEnvelope.sol` in this repo (owner, delegate, token, cap, revoke, withdraw). Do not start a new AA/root-identity design.

**Attribution:** `toDataSuffix(assignedTag)` on every human-submitted tx. x402 (if any) is credited via **agent wallet** on the Celo Builders submission, not the calldata tag. [Skill](https://celobuilders.xyz/skill.md).

**Independent parties (Tracks 1–2):** recipient must not be a registered project wallet, must not be first-funded by us, and should have Celo activity **before 28 Aug 2026**. Do not farm.

---

## 5. Repo layout (this feature)

| Path | Slice |
| --- | --- |
| `docs/SDD.md` | This file |
| `docs/PRODUCTION_PIPELINE.md` | Send/swap ledger (keep) |
| `components/Settings/` + new `components/Agents/` | S3–S4, S6 UI |
| `utils/prism/` or `utils/envelope/` | S2 client |
| `scripts/agent-envelope.ts` | S5 runner |
| `app/api/agents/` (optional) | Persist envelope address per user; not a custody API |
| `packages/wallet-embed` | **Do not fork.** Signer only |

---

## 6. Open decisions (block S1)

Record the choice in this table when you lock it; do not leave two GitHubs or two 8004 ids.

| Decision | Options | Status |
| --- | --- | --- |
| Registration GitHub | `gerryalvrz/neonpayments` vs `CeloMX/neonpayments` — **the remote you will push to** | Unlocked |
| Agent key | Fresh Celo key for NeonPay vs reuse AgentMotus | Unlocked — prefer **fresh** |
| Envelope | PrismFactory V2 vs `AgentEnvelope.sol` in this repo | Unlocked in S2 |
| Primary track | `judges-favorite` (default) | Proposed |

---

## 7. Slices

### S0 — Product freeze (this feature)

**In:** Enable, fund envelope with **wMXN transfer**, agent send, revoke. Same screens on MiniPay and web.  
**Out:** Corridor CLI, Self-as-universal-wallet, mock success, Textile wMXN swap.

**AC**

- [ ] README or Settings copy states: agent never receives the MiniPay/Privy key.  
- [ ] No mock `addTransaction` as the only proof of envelope send (follow pipeline: hash on chain).  
- [ ] PRs for this work cite `S0`–`S8`.

---

### S1 — Hackathon registration

**Owner:** human + coding agent with Celo Builders skill.  
**When:** before more envelope code if possible. Leaderboards read **zero** until agent wallet + tag exist.

```bash
npx skills add https://celobuilders.xyz
# re-fetch skill.md if this copy is old
```

**Required at registration**

- Public `githubUrl` (must still 200 on 14 Sep)  
- `telegram`, `primaryTrack` = `judges-favorite`  
- `erc8004Url` — [8004scan](https://8004scan.io) `https://8004scan.io/agents/celo/<ID>` or Celoscan NFT on `0x8004A169…`  
- `agentWalletAddress` — the **agent** EOA, not a MiniPay user  

**AC**

- [ ] `GET` submission shows `attributionTag` (`celo_` + 12 hex).  
- [ ] Agent wallet is on file.  
- [ ] Tag pasted into `docs/SDD.md` §6 or `.env.example` as `NEXT_PUBLIC_HACKATHON_TAG` (no private keys in git).

**Publish (S8):** X post `@CeloDevs` + `@Celo` + 8004 link; `celoNetwork` = `celo-mainnet`; declare `otherWallets` / `ownContracts`. Video optional.

---

### S2 — Envelope on Celo mainnet

**Job:** one contract (or Factory-created context) the human owns and the agent may spend from.

**AC**

- [ ] `create` from the human signer: stores owner, delegate (agent), wMXN token, per-tx cap, optional daily cap, TTL.  
- [ ] Delegate can `execute` / `transfer` wMXN **to** `recipient` only if `amount ≤ cap` and not revoked/expired.  
- [ ] Owner `revoke()`; further delegate calls revert.  
- [ ] Owner can withdraw leftover wMXN after revoke (or withdraw is the same as revoke+sweep).  
- [ ] Addresses written here:

| Contract | Address |
| --- | --- |
| Envelope or context | _TBD_ |
| Factory (if used) | _TBD_ |

Anchor: `utils/envelope/` or `utils/prism/` + ABI. Tests: Foundry or a scripted mainnet dry-run on a tiny amount.

---

### S3 — NeonPay UI: Enable

**Anchors:** `components/Settings/SettingsScreen.tsx` (new Agents block or tab). New `components/Agents/AgentEnvelopePanel.tsx`. `context/AppContext.tsx` / `useWallet()` — do not add a second wallet stack.

**AC**

- [ ] Connected wallet only. MiniPay: no extra Connect button (existing auto-connect).  
- [ ] Form: agent address (default from env `NEXT_PUBLIC_AGENT_ADDRESS`), cap per tx, daily cap, TTL. EN/ES.  
- [ ] Confirm → human signs `create`. UI shows envelope address + Celoscan link.  
- [ ] If envelope already exists for this owner+agent, show it; do not error as a dead end.

---

### S4 — Fund

**AC**

- [ ] “Fund” sends **wMXN** from `wallet.address` → envelope (`wallet.sendToken` + pipeline intent row if P1 send path exists).  
- [ ] Balance shown: human wMXN vs envelope wMXN.  
- [ ] Insufficient balance: friendly EN/ES, no raw ethers dump.  
- [ ] Do not invent a Textile/Squid buy-wMXN path in this slice.

---

### S5 — Agent runner (send)

**Anchor:** `scripts/agent-envelope.ts` (or `scripts/agent-envelope.sh` + tsx). Env: `AGENT_PRIVATE_KEY` on the **machine only** (`~/.config/neonpay/` or similar, `chmod 600`). Never commit keys.

**AC**

- [ ] Script loads envelope + wMXN + recipient + amount.  
- [ ] Sends from **agent key** via envelope (not from the human MiniPay key).  
- [ ] Calldata includes `toDataSuffix(process.env.HACKATHON_TAG)`.  
- [ ] Prints tx hash. After confirm, human can open Celoscan from UI activity if wired.  
- [ ] Demo amount small (e.g. 10 wMXN or 1). Recipient documented (prefer independent party).

---

### S6 — Revoke

**AC**

- [ ] NeonPay button: owner signs `revoke` (and sweep if separate).  
- [ ] UI state: envelope inactive.  
- [ ] Re-run S5 script → revert (`ContextRevoked` / custom error). Capture tx or revert message for the demo.  
- [ ] Leftover wMXN returns to human or is withdrawable in one tap.

---

### S7 — MiniPay pass

**AC**

- [ ] Same Enable / Fund / Revoke path with `wallet.isMiniPay === true` (no provider picker).  
- [ ] Fee abstraction: do not require a CELO balance; do not show “buy CELO for gas.”  
- [ ] Spanish default when MiniPay (align with PRODUCTION_PIPELINE §3).  
- [ ] If Discover listing is not live, **web Privy path is an accepted demo**; MiniPay is the preferred door, not a second product.

---

### S8 — Evidence + submit

**AC**

- [ ] Table of mainnet txs (create, fund, agent send, revoke, failed send) in this file or `docs/hackathon-evidence.md`.  
- [ ] 8004 page live. Tag verified with `verifyTx` from `@celo/attribution-tags`.  
- [ ] X post URL. Optional 60–90s video of the S3–S6 loop.  
- [ ] `npx skills add https://celobuilders.xyz` → publish before **14 Sep 2026 09:00 GMT**.  
- [ ] Commits on the registered repo across the window (not a dump on day 13).

---

## 8. Slice order

```text
S0 freeze
  → S1 register (tag + 8004 + agent wallet)
  → S2 envelope on mainnet
  → S3 Enable UI
  → S4 Fund
  → S5 agent send + tag
  → S6 Revoke
  → S7 MiniPay (can overlap S3–S6)
  → S8 submit
```

S1 can start **today** without S2. S5 is blocked on S2+S4. S8 is blocked on at least one successful S5 + S6 on mainnet.

---

## 9. Test plan (demo script)

1. MiniPay (or web): NeonPay connected, wMXN balance > 0.  
2. Enable envelope for documented agent address.  
3. Fund 50 wMXN (or less). Envelope balance updates.  
4. Run agent script: 10 wMXN out. Recipient balance / Celoscan.  
5. Revoke.  
6. Agent script again: fails.  
7. Human withdraws remainder.

---

## 10. End game (out of contest scope)

Same primitive, later: more agents, other apps asking for a context, optional Self-nullifier canonical root so Privy and MiniPay show one balance. **Not S0–S8.**
