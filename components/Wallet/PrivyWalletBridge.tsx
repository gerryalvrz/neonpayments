'use client';

/**
 * Publishes Privy session into the wallet session bus for PrivyProvider adapter.
 */

import { useEffect, useRef } from 'react';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { setWalletSession } from '@/utils/wallet/session';
import type { Eip1193Provider } from '@/utils/wallet/types';

export function PrivyWalletBridge({ children }: { children: React.ReactNode }) {
  const { ready, authenticated, login, logout, user } = usePrivy();
  const { wallets } = useWallets();
  const eip1193Ref = useRef<Eip1193Provider | null>(null);

  useEffect(() => {
    let cancelled = false;

    const publish = async () => {
      const embedded =
        wallets.find((w) => w.walletClientType === 'privy') || wallets[0];
      const address =
        embedded?.address ||
        (user as { wallet?: { address?: string } } | null)?.wallet?.address ||
        null;

      if (embedded?.getEthereumProvider) {
        try {
          const provider = (await embedded.getEthereumProvider()) as Eip1193Provider;
          if (!cancelled) {
            eip1193Ref.current = provider;
          }
        } catch {
          // provider may not be ready yet
        }
      }

      if (cancelled) return;

      setWalletSession({
        providerType: 'privy',
        ready,
        authenticated,
        address,
        chainId: 42220,
        login: async () => {
          await login();
        },
        logout: async () => {
          await logout();
        },
        eip1193: eip1193Ref.current,
        signMessage: async (message: string) => {
          if (!eip1193Ref.current || !address) {
            throw new Error('No Privy signer available');
          }
          return String(
            await eip1193Ref.current.request({
              method: 'personal_sign',
              params: [message, address],
            })
          );
        },
      });
    };

    void publish();

    return () => {
      cancelled = true;
    };
  }, [ready, authenticated, login, logout, user, wallets]);

  useEffect(() => {
    return () => {
      setWalletSession(null);
    };
  }, []);

  return <>{children}</>;
}
