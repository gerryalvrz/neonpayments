/**
 * Privy Provider Wrapper
 *
 * Mounts Privy only when selected for standalone mode.
 */

'use client';

import { PrivyProvider } from '@privy-io/react-auth';
import { PrivyWalletBridge } from './PrivyWalletBridge';

export function PrivyProviderWrapper({ children }: { children: React.ReactNode }) {
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID || '';

  return (
    <PrivyProvider
      appId={appId}
      config={{
        loginMethods: ['email', 'sms', 'passkey'],
        appearance: {
          theme: 'light',
        },
        embeddedWallets: {
          ethereum: {
            createOnLogin: 'users-without-wallets',
          },
        },
      }}
    >
      <PrivyWalletBridge>{children}</PrivyWalletBridge>
    </PrivyProvider>
  );
}
