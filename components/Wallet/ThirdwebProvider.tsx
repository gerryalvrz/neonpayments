'use client';

/**
 * thirdweb client + provider wrapper with session bridge.
 */

import { useCallback, useEffect, useMemo } from 'react';
import {
  ThirdwebProvider,
  useActiveAccount,
  useActiveWallet,
  useActiveWalletChain,
  useConnectModal,
  useDisconnect,
} from 'thirdweb/react';
import { createThirdwebClient } from 'thirdweb';
import { celo } from 'thirdweb/chains';
import { inAppWallet, EIP1193 } from 'thirdweb/wallets';
import { setWalletSession } from '@/utils/wallet/session';
import type { Eip1193Provider } from '@/utils/wallet/types';

const clientId = process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID || '';

export const thirdwebClient = createThirdwebClient({
  clientId: clientId || 'placeholder',
});

function ThirdwebWalletBridge({ children }: { children: React.ReactNode }) {
  const account = useActiveAccount();
  const wallet = useActiveWallet();
  const chain = useActiveWalletChain();
  const { connect, isConnecting } = useConnectModal();
  const { disconnect } = useDisconnect();

  const eip1193 = useMemo<Eip1193Provider | null>(() => {
    if (!wallet) return null;
    try {
      return EIP1193.toProvider({
        wallet,
        client: thirdwebClient,
        chain: chain || celo,
      }) as Eip1193Provider;
    } catch {
      return null;
    }
  }, [wallet, chain]);

  const login = useCallback(async () => {
    await connect({
      client: thirdwebClient,
      chain: celo,
      wallets: [
        inAppWallet({
          auth: {
            options: ['email', 'phone', 'google', 'apple', 'passkey'],
          },
        }),
      ],
    });
  }, [connect]);

  const logout = useCallback(async () => {
    if (wallet) {
      await disconnect(wallet);
    }
  }, [disconnect, wallet]);

  useEffect(() => {
    setWalletSession({
      providerType: 'thirdweb',
      ready: Boolean(clientId) || true,
      authenticated: Boolean(account?.address),
      address: account?.address || null,
      chainId: chain?.id || 42220,
      login,
      logout,
      eip1193,
      signMessage: account
        ? async (message: string) => {
            const sig = await account.signMessage({ message });
            return typeof sig === 'string' ? sig : String(sig);
          }
        : undefined,
    });
  }, [account, chain, eip1193, login, logout, isConnecting]);

  useEffect(() => {
    return () => setWalletSession(null);
  }, []);

  return <>{children}</>;
}

export function ThirdwebProviderWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThirdwebProvider>
      <ThirdwebWalletBridge>{children}</ThirdwebWalletBridge>
    </ThirdwebProvider>
  );
}
