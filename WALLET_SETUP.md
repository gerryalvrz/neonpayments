# Wallet Provider Setup Guide

## Overview

Your app now supports **dual wallet integration**:
- **MiniPay** (mobile miniapp) - Auto-detected and used when running in MiniPay
- **Privy** (desktop/standalone) - Used when running in regular browser

## ✅ What's Been Implemented

1. ✅ **Wallet Provider Abstraction** - Unified interface for both providers
2. ✅ **Environment Detection** - Automatically detects MiniPay vs standalone
3. ✅ **MiniPay Integration** - Full MiniPay wallet provider implementation
4. ✅ **Privy Integration** - Privy provider structure (needs Privy package)
5. ✅ **Unified Hook** - `useWallet()` hook works with both providers
6. ✅ **AppContext Integration** - Wallet state integrated into app context
7. ✅ **AuthScreen Updates** - Different UI for MiniPay vs standalone

## 📦 Next Steps: Install Privy (for Desktop Support)

### 1. Install Privy Package

```bash
npm install @privy-io/react-auth
```

### 2. Get Privy App ID

1. Go to [Privy Dashboard](https://dashboard.privy.io)
2. Create a new app or use existing
3. Copy your App ID

### 3. Set Environment Variable

Create/update `.env.local`:

```bash
NEXT_PUBLIC_PRIVY_APP_ID=your_privy_app_id_here
```

### 4. Update Privy Provider Component

The `components/Wallet/PrivyProvider.tsx` file has placeholder code. Update it:

```typescript
'use client';

import { PrivyProvider as PrivyProviderBase } from '@privy-io/react-auth';
import { getEnvironment } from '@/utils/wallet/detection';

export function PrivyProviderWrapper({ children }: { children: React.ReactNode }) {
  const environment = getEnvironment();
  const isMiniPay = environment === 'minipay';

  // In MiniPay, don't use Privy
  if (isMiniPay) {
    return <>{children}</>;
  }

  // In standalone mode, wrap with Privy
  return (
    <PrivyProviderBase
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID || ''}
      config={{
        loginMethods: ['email', 'phone'],
        appearance: {
          theme: 'light',
        },
        embeddedWallets: {
          createOnLogin: 'users-without-wallets',
        },
      }}
    >
      {children}
    </PrivyProviderBase>
  );
}
```

### 5. Add Privy Provider to Layout

Update `app/layout.tsx`:

```typescript
import { PrivyProviderWrapper } from '@/components/Wallet/PrivyProvider';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <PrivyProviderWrapper>
          <AppProvider>
            {/* ... rest of your layout */}
          </AppProvider>
        </PrivyProviderWrapper>
      </body>
    </html>
  );
}
```

### 6. Update Privy Provider Implementation

Update `utils/wallet/providers/privy.ts` to use actual Privy hooks:

```typescript
import { usePrivy } from '@privy-io/react-auth';

// In your component, use:
const { ready, authenticated, user, login, logout, sendTransaction, signMessage } = usePrivy();
```

## 🧪 Testing

### Test MiniPay Mode

1. Open MiniPay wallet on mobile
2. Navigate to your miniapp URL
3. Should auto-connect to MiniPay wallet
4. No login form shown (wallet already connected)

### Test Standalone Mode

1. Open in regular browser (Chrome, Firefox, etc.)
2. Navigate to `/auth`
3. Should show email/phone login form
4. Uses Privy for wallet creation

## 📁 File Structure

```
utils/wallet/
├── types.ts              # TypeScript interfaces
├── detection.ts          # Environment detection
├── providers/
│   ├── minipay.ts       # MiniPay provider ✅
│   ├── privy.ts         # Privy provider (needs Privy package)
│   └── index.ts         # Provider factory
├── useWallet.ts          # Unified React hook ✅
└── README.md             # Detailed documentation

components/Wallet/
└── PrivyProvider.tsx     # Privy wrapper (needs update)

context/
└── AppContext.tsx        # Updated with wallet integration ✅

components/Auth/
└── AuthScreen.tsx        # Updated for both providers ✅
```

## 🔑 Key Features

### Auto-Detection
- Automatically detects MiniPay environment
- Falls back to Privy for standalone

### Unified API
```typescript
const { wallet } = useApp();
// wallet.isConnected
// wallet.address
// wallet.isMiniPay
// wallet.connect()
// wallet.disconnect()
```

### Different UX
- **MiniPay**: Auto-connects, shows "Connect Wallet" button
- **Standalone**: Shows email/phone login form

## 🚀 Hackathon Strategy

1. **Phase 1** (Now): MiniPay integration is ready ✅
   - Test in MiniPay environment
   - Focus on MiniPay-specific features

2. **Phase 2** (If time): Add Privy for desktop
   - Install Privy package
   - Update PrivyProvider component
   - Test standalone mode

3. **Phase 3**: Demo both versions
   - Show MiniPay on mobile
   - Show desktop version as backup

## 📝 Notes

- MiniPay integration is **complete and ready to use**
- Privy integration needs the package installed and configured
- The abstraction layer means you can add Privy later without changing your app code
- All wallet operations go through the unified `useWallet()` hook

## 🐛 Troubleshooting

### MiniPay not detected?
- Check browser console: `console.log(window.ethereum)`
- Verify MiniPay is installed and running
- Check if `window.ethereum.isMiniPay === true`

### Privy errors?
- Verify `NEXT_PUBLIC_PRIVY_APP_ID` is set
- Check Privy dashboard for app status
- Ensure PrivyProvider is mounted in layout

## 📚 Documentation

See `utils/wallet/README.md` for detailed API documentation.

