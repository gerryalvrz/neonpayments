'use client';

/**
 * human.tech WaaP — no API key required.
 * Pattern aligned with MotusDAO hub: initWaaP → window.waap (EIP-1193).
 *
 * @see https://docs.wallet.human.tech/quick-start
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { setWalletSession } from '@/utils/wallet/session';
import type { Eip1193Provider } from '@/utils/wallet/types';

const CELO_CHAIN_ID_HEX = '0xa4ec'; // 42220

type WaapProviderApi = Eip1193Provider & {
  login?: () => Promise<string | null>;
  logout?: () => Promise<void>;
  isConnected?: () => boolean;
  getLoginMethod?: () => string | null;
  on?: (event: string, handler: (...args: unknown[]) => void) => void;
  removeListener?: (event: string, handler: (...args: unknown[]) => void) => void;
};

function getWaap(): WaapProviderApi | undefined {
  if (typeof window === 'undefined') return undefined;
  return (window as Window & { waap?: WaapProviderApi }).waap;
}

async function ensureCelo(waap: WaapProviderApi): Promise<void> {
  try {
    const chainId = await waap.request({ method: 'eth_chainId' });
    if (String(chainId).toLowerCase() === CELO_CHAIN_ID_HEX) return;
    try {
      await waap.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: CELO_CHAIN_ID_HEX }],
      });
    } catch {
      await waap.request({
        method: 'wallet_addEthereumChain',
        params: [
          {
            chainId: CELO_CHAIN_ID_HEX,
            chainName: 'Celo',
            nativeCurrency: { name: 'CELO', symbol: 'CELO', decimals: 18 },
            rpcUrls: [process.env.NEXT_PUBLIC_CELO_RPC_URL || 'https://forno.celo.org'],
            blockExplorerUrls: ['https://celoscan.io'],
          },
        ],
      });
    }
  } catch (error) {
    console.warn('[WAAP] Could not ensure Celo network', error);
  }
}

function WaapWalletBridge({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const initOnce = useRef(false);

  useEffect(() => {
    if (initOnce.current) return;
    initOnce.current = true;

    const initialize = async () => {
      try {
        const waapSdk = await import('@human.tech/waap-sdk');
        const walletConnectProjectId =
          process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || undefined;

        const authenticationMethods: Array<
          'email' | 'phone' | 'social' | 'biometrics' | 'wallet'
        > = walletConnectProjectId
          ? ['email', 'phone', 'social', 'biometrics', 'wallet']
          : ['email', 'phone', 'social', 'biometrics'];

        waapSdk.initWaaP({
          useStaging: process.env.NEXT_PUBLIC_WAAP_USE_STAGING === 'true',
          walletConnectProjectId,
          config: {
            authenticationMethods,
            allowedSocials: ['google', 'twitter', 'discord'],
            styles: {
              darkMode: false,
            },
            showSecured: true,
          },
          project: {
            name: 'NeonPay MX',
            entryTitle: 'Log in to NeonPay MX',
          },
        });

        // Poll briefly for window.waap (SDK sometimes attaches async)
        let provider = getWaap();
        for (let i = 0; i < 20 && !provider; i++) {
          await new Promise((r) => setTimeout(r, 100));
          provider = getWaap();
        }

        if (!provider) {
          console.warn('[WAAP] initWaaP ran but window.waap is missing');
          setReady(false);
          setWalletSession({
            providerType: 'waap',
            ready: false,
            authenticated: false,
            address: null,
            chainId: 42220,
            login: async () => {
              throw new Error('WaaP SDK did not initialize (window.waap missing)');
            },
            logout: async () => {},
            eip1193: null,
          });
          return;
        }

        console.log('[WAAP] Ready. window.waap available.');
        setReady(true);
      } catch (error) {
        console.error('[WAAP] Failed to init', error);
        setReady(false);
      }
    };

    void initialize();
  }, []);

  const login = useCallback(async () => {
    const waap = getWaap();
    if (!waap?.login) {
      throw new Error('WaaP login unavailable — SDK not initialized');
    }

    const loginType = await waap.login();
    // MotusDAO pattern: null means user closed the modal
    if (loginType === null) {
      throw new Error('Login cancelled');
    }

    await ensureCelo(waap);

    const accounts = (await waap.request({
      method: 'eth_requestAccounts',
    })) as string[];

    if (!accounts?.length) {
      throw new Error('No accounts returned from human.tech');
    }
  }, []);

  const logout = useCallback(async () => {
    const waap = getWaap();
    if (waap?.logout) {
      await waap.logout();
    }
  }, []);

  useEffect(() => {
    if (!ready) return;
    const waap = getWaap();
    if (!waap) return;

    let cancelled = false;

    const publish = async () => {
      const eip1193 = getWaap() || null;
      let address: string | null = null;
      try {
        if (eip1193?.request) {
          const accounts = (await eip1193.request({
            method: 'eth_accounts',
          })) as string[];
          address = accounts?.[0] || null;
        }
      } catch {
        address = null;
      }

      if (cancelled) return;

      setWalletSession({
        providerType: 'waap',
        ready: Boolean(getWaap()),
        authenticated: Boolean(address),
        address,
        chainId: 42220,
        login,
        logout,
        eip1193,
      });
    };

    void publish();

    const onAccounts = () => {
      void publish();
    };
    waap.on?.('accountsChanged', onAccounts);
    waap.on?.('connect', onAccounts);
    waap.on?.('disconnect', onAccounts);

    const id = window.setInterval(() => {
      void publish();
    }, 2500);

    return () => {
      cancelled = true;
      window.clearInterval(id);
      getWaap()?.removeListener?.('accountsChanged', onAccounts);
      getWaap()?.removeListener?.('connect', onAccounts);
      getWaap()?.removeListener?.('disconnect', onAccounts);
    };
  }, [ready, login, logout]);

  useEffect(() => {
    return () => setWalletSession(null);
  }, []);

  return <>{children}</>;
}

export function WaapProviderWrapper({ children }: { children: React.ReactNode }) {
  return <WaapWalletBridge>{children}</WaapWalletBridge>;
}
