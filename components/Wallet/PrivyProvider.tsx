/**
 * Privy Provider Wrapper
 * 
 * Wraps the app with Privy provider for desktop/standalone mode
 * Only renders when not in MiniPay environment
 */

'use client';

import { useEffect } from 'react';
import { PrivyProvider } from '@privy-io/react-auth';
import { getEnvironment } from '@/utils/wallet/detection';

// Privy will be imported when package is installed
// For now, this is a placeholder structure
export function PrivyProviderWrapper({ children }: { children: React.ReactNode }) {
  const environment = getEnvironment();
  const isMiniPay = environment === 'minipay';

  useEffect(() => {
    // Only initialize Privy if not in MiniPay
    if (!isMiniPay) {
      // Privy initialization will happen here
      // This requires @privy-io/react-auth package
      console.log('Initializing Privy for standalone mode');
    }
  }, [isMiniPay]);

  // In MiniPay, just render children without Privy
  if (isMiniPay) {
    return <>{children}</>;
  }

  // Standalone: wrap with real Privy provider
  return (
    <PrivyProvider
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID || ''}
      config={{
        loginMethods: ['email', 'sms'],
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
      {children}
    </PrivyProvider>
  );
}
