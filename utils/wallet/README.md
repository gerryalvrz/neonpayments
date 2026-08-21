# Wallet Provider Abstraction

Unified wallet layer for **MiniPay**, **Privy**, **thirdweb**, and **human.tech (WaaP)**.

See [WALLET_SETUP.md](../../WALLET_SETUP.md) for env vars and UX.

## Layout

```
utils/wallet/
├── types.ts
├── selection.ts      # localStorage: neonpay.walletProvider
├── session.ts        # InjectedWalletSession bus (bridges → adapters)
├── detection.ts
├── providers/        # minipay, privy, thirdweb, waap
├── useWallet.ts      # No vendor hook imports
└── index.ts
```

## Usage

```typescript
import { useApp } from '@/context/AppContext';

const { wallet } = useApp();
// wallet.connect() / disconnect() / setProvider('thirdweb')
// wallet.selectedProvider / wallet.provider / wallet.sendToken(...)
```

Standalone connect flows open `ProviderPickerModal`. MiniPay auto-connects without a picker.

`useWallet` stays vendor-agnostic; React bridges under `components/Wallet/` publish sessions via `setWalletSession`.
