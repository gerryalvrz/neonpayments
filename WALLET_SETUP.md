# Wallet Provider Setup Guide

NeonPay uses **`@celomx/wallet-embed`** — a vendor-agnostic embedded wallet SDK.

Other projects can copy `packages/wallet-embed` or depend on it. See [packages/wallet-embed/README.md](packages/wallet-embed/README.md).

## Overview

NeonPay supports **multiple wallet providers**:

- **MiniPay** (mobile miniapp) — auto-detected; no picker
- **Privy**, **thirdweb**, **human.tech (WaaP)** — user-selectable on standalone/desktop

Only one SDK is mounted at a time (never nested). Choice is stored in `localStorage` under `neonpay.walletProvider`.

## Environment variables

```bash
# Required for Privy
NEXT_PUBLIC_PRIVY_APP_ID=your_privy_app_id

# Required for thirdweb
NEXT_PUBLIC_THIRDWEB_CLIENT_ID=your_thirdweb_client_id

# Optional for human.tech WaaP (only if enabling external wallets via WalletConnect)
# Email / phone / social work with ZERO keys — same as MotusDAO hub.
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id
NEXT_PUBLIC_WAAP_USE_STAGING=false

# Shared Celo RPC (balances / reads)
NEXT_PUBLIC_CELO_RPC_URL=https://forno.celo.org
```

Config lives in `components/Wallet/WalletEmbedRoot.tsx` (passed into `WalletEmbedProvider`).

## Architecture

```
packages/wallet-embed/          # reusable SDK
  WalletEmbedProvider           # config + mount one vendor SDK
  useWallet()                   # vendor-agnostic hook
  ProviderPicker                # unstyled picker for other apps

components/Wallet/
  WalletEmbedRoot.tsx           # NeonPay credentials / namespace
  ProviderPickerModal.tsx       # NeonPay-themed picker
```

App screens still use `useApp().wallet` (`connect`, `sendToken`, `setProvider`, etc.).
`utils/wallet/*` re-exports the package so existing imports keep working.

## UX

1. **MiniPay**: connect goes straight to MiniPay.
2. **Standalone**: Connect / Get Started opens the provider picker (Privy / thirdweb / human.tech).
3. **Settings → Connected Accounts**: change provider (disconnects, remounts SDK, reconnects).

## Notes

- Same email ≠ same address across vendors (different key systems).
- `app/x402/privy` remains Privy-specific (`useX402Fetch`).
- Ensure the matching env var is set before selecting that provider.
