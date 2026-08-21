# Wallet Provider Setup Guide

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

## Architecture

```
utils/wallet/
├── types.ts              # WalletProvider + InjectedWalletSession
├── selection.ts          # Persist standalone provider choice
├── session.ts            # Bridge → adapter session bus
├── detection.ts          # MiniPay vs standalone
├── providers/
│   ├── minipay.ts
│   ├── privy.ts
│   ├── thirdweb.ts
│   ├── waap.ts
│   └── index.ts
└── useWallet.ts          # Vendor-agnostic hook (no Privy imports)

components/Wallet/
├── WalletSdkShell.tsx    # Lazy-mounts selected SDK only
├── PrivyProvider.tsx + PrivyWalletBridge.tsx
├── ThirdwebProvider.tsx
├── WaapProvider.tsx
└── ProviderPickerModal.tsx
```

App screens use `useApp().wallet` (`connect`, `sendToken`, `setProvider`, etc.).

## UX

1. **MiniPay**: connect goes straight to MiniPay.
2. **Standalone**: Connect / Get Started opens the provider picker (Privy / thirdweb / human.tech).
3. **Settings → Connected Accounts**: change provider (disconnects, remounts SDK, reconnects).

## Notes

- Same email ≠ same address across vendors (different key systems).
- `app/x402/privy` remains Privy-specific (`useX402Fetch`).
- Ensure the matching env var is set before selecting that provider.
