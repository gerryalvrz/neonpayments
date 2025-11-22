# Wallet Provider Abstraction

This directory contains a unified wallet provider abstraction that supports both **MiniPay** (mobile miniapp) and **Privy** (desktop/standalone web app).

## Architecture

```
utils/wallet/
├── types.ts              # TypeScript interfaces and types
├── detection.ts          # Environment detection utilities
├── providers/
│   ├── minipay.ts       # MiniPay wallet provider
│   ├── privy.ts         # Privy wallet provider
│   └── index.ts         # Provider factory
├── useWallet.ts          # Unified React hook
└── index.ts              # Main exports
```

## Features

- **Environment Detection**: Automatically detects if running in MiniPay or standalone
- **Unified API**: Same interface for both providers
- **Auto-connect**: Automatically connects in MiniPay environment
- **Type-safe**: Full TypeScript support

## Usage

### Basic Usage

```typescript
import { useWallet } from '@/utils/wallet';

function MyComponent() {
  const { 
    isConnected, 
    address, 
    isMiniPay, 
    connect, 
    disconnect 
  } = useWallet();

  return (
    <div>
      {isConnected ? (
        <p>Connected: {address}</p>
      ) : (
        <button onClick={connect}>Connect Wallet</button>
      )}
    </div>
  );
}
```

### In AppContext

The wallet is already integrated into `AppContext`:

```typescript
import { useApp } from '@/context/AppContext';

function MyComponent() {
  const { wallet } = useApp();
  
  // wallet.isConnected
  // wallet.address
  // wallet.isMiniPay
  // wallet.connect()
  // wallet.disconnect()
}
```

## Environment Detection

The system automatically detects the environment:

- **MiniPay**: Detects `window.ethereum.isMiniPay` or `window.minipay`
- **Standalone**: Falls back to Privy provider

## MiniPay Integration

MiniPay is automatically detected and used when:
- Running inside MiniPay wallet
- `window.ethereum.isMiniPay === true` is detected

The MiniPay provider:
- Uses standard EIP-1193 interface
- Supports `eth_requestAccounts`, `eth_sendTransaction`, `personal_sign`
- Auto-connects on mount in MiniPay environment

## Privy Integration

Privy is used for standalone/web mode. To set up:

1. Install Privy:
```bash
npm install @privy-io/react-auth
```

2. Add Privy Provider to `app/layout.tsx`:
```typescript
import { PrivyProvider } from '@privy-io/react-auth';

export default function RootLayout({ children }) {
  return (
    <PrivyProvider
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID}
      config={{
        loginMethods: ['email', 'phone'],
        embeddedWallets: {
          createOnLogin: 'users-without-wallets',
        },
      }}
    >
      {children}
    </PrivyProvider>
  );
}
```

3. Update `components/Wallet/PrivyProvider.tsx` to use the actual Privy provider.

4. Set environment variable:
```bash
NEXT_PUBLIC_PRIVY_APP_ID=your_privy_app_id
```

## Provider Methods

All providers implement the same interface:

- `connect()`: Connect to wallet
- `disconnect()`: Disconnect from wallet
- `getAccount()`: Get current account
- `getAddress()`: Get wallet address
- `signTransaction()`: Sign and send transaction
- `signMessage()`: Sign a message
- `getChainId()`: Get current chain ID

## Testing

### Test MiniPay Mode

1. Open MiniPay wallet
2. Navigate to your miniapp URL
3. The app should auto-detect MiniPay and connect

### Test Standalone Mode

1. Open in regular browser (not MiniPay)
2. The app should use Privy provider
3. User can connect via email/phone

## Troubleshooting

### MiniPay not detected

- Check browser console for `window.ethereum`
- Verify MiniPay is installed and running
- Check user agent for MiniPay indicators

### Privy not working

- Verify `NEXT_PUBLIC_PRIVY_APP_ID` is set
- Check Privy dashboard for app configuration
- Ensure PrivyProvider is mounted in layout

## Next Steps

1. Install Privy package: `npm install @privy-io/react-auth`
2. Get Privy App ID from [Privy Dashboard](https://dashboard.privy.io)
3. Update `PrivyProvider.tsx` with actual Privy integration
4. Test both environments

