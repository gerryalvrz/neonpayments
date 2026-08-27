'use client';

import type { ReactNode } from 'react';
import {
  CELO_MAINNET,
  WalletEmbedProvider,
  type WalletEmbedConfigInput,
} from '@celomx/wallet-embed';

const config: WalletEmbedConfigInput = {
  appName: 'NeonPay MX',
  loginTitle: 'Log in to NeonPay MX',
  namespace: 'neonpay',
  defaultProvider: 'privy',
  enabledProviders: ['privy', 'thirdweb', 'waap'],
  chain: {
    ...CELO_MAINNET,
    rpcUrl: process.env.NEXT_PUBLIC_CELO_RPC_URL || CELO_MAINNET.rpcUrl,
  },
  credentials: {
    privy: {
      appId: process.env.NEXT_PUBLIC_PRIVY_APP_ID || '',
      loginMethods: ['email', 'sms', 'passkey'],
    },
    thirdweb: {
      clientId: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID || '',
    },
    waap: {
      walletConnectProjectId:
        process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || undefined,
      useStaging: process.env.NEXT_PUBLIC_WAAP_USE_STAGING === 'true',
    },
  },
};

export function WalletEmbedRoot({ children }: { children: ReactNode }) {
  return <WalletEmbedProvider config={config}>{children}</WalletEmbedProvider>;
}
