'use client';

/**
 * Mounts Privy only when selected for standalone mode.
 */

import type { ReactNode } from 'react';
import { PrivyProvider } from '@privy-io/react-auth';
import { getWalletEmbedConfig, type PrivyLoginMethod } from '../config';
import { PrivyWalletBridge } from './PrivyWalletBridge';

const DEFAULT_LOGIN_METHODS: PrivyLoginMethod[] = ['email', 'sms', 'wallet', 'passkey'];

export function PrivyProviderWrapper({ children }: { children: ReactNode }) {
  const { credentials } = getWalletEmbedConfig();
  const appId = credentials.privy?.appId || '';
  const loginMethods = credentials.privy?.loginMethods || DEFAULT_LOGIN_METHODS;

  return (
    <PrivyProvider
      appId={appId}
      config={{
        loginMethods,
        appearance: {
          theme: 'light',
          walletChainType: 'ethereum-only',
          walletList: [
            'detected_ethereum_wallets',
            'metamask',
            'coinbase_wallet',
            'rainbow',
            'okx_wallet',
            'wallet_connect',
          ],
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
