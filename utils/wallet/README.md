# Wallet Provider Abstraction

Unified wallet layer for **MiniPay**, **Privy**, **thirdweb**, and **human.tech (WaaP)**.

Implementation lives in **`@celomx/wallet-embed`** (`packages/wallet-embed`). This folder re-exports it so existing `@/utils/wallet/...` imports keep working.

See [WALLET_SETUP.md](../../WALLET_SETUP.md) and [packages/wallet-embed/README.md](../../packages/wallet-embed/README.md).

## Usage

```typescript
import { useApp } from '@/context/AppContext';

const { wallet } = useApp();
// wallet.connect() / disconnect() / setProvider('thirdweb')
// wallet.selectedProvider / wallet.provider / wallet.sendToken(...)
```

Standalone connect flows open `ProviderPickerModal`. MiniPay auto-connects without a picker.

`useWallet` stays vendor-agnostic; React bridges inside the SDK publish sessions via `setWalletSession`.
