/**
 * Unified Wallet Hook
 *
 * Vendor-agnostic React hook for wallet operations.
 * Does not import Privy / thirdweb / WaaP hooks — bridges inject sessions.
 */

'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { getWalletProvider } from './providers';
import { getEnvironment } from './detection';
import {
  getSelectedStandaloneProvider,
  setSelectedStandaloneProvider,
} from './selection';
import type {
  WalletProvider,
  WalletState,
  TransactionRequest,
  StandaloneWalletProviderType,
  WalletProviderType,
} from './types';
import { JsonRpcProvider, Contract } from 'ethers';
import { ERC20_ABI, encodeTransfer } from './erc20';
import { subscribeWalletSession } from './session';
import { sendWalletTransaction } from './recoverTxHash';

export function useWallet() {
  const [standaloneChoice, setStandaloneChoice] = useState<StandaloneWalletProviderType>(
    () => (typeof window !== 'undefined' ? getSelectedStandaloneProvider() : 'privy')
  );
  const [state, setState] = useState<WalletState>({
    provider: 'none',
    account: null,
    isConnecting: false,
    error: null,
  });
  const providerRef = useRef<WalletProvider | null>(null);

  const provider = useMemo(() => {
    const p = getWalletProvider();
    providerRef.current = p;
    return p;
  }, [standaloneChoice]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onChange = (event: Event) => {
      const detail = (event as CustomEvent<StandaloneWalletProviderType>).detail;
      if (detail) {
        setStandaloneChoice(detail);
      } else {
        setStandaloneChoice(getSelectedStandaloneProvider());
      }
    };
    window.addEventListener('neonpay:wallet-provider-changed', onChange);
    return () => window.removeEventListener('neonpay:wallet-provider-changed', onChange);
  }, []);

  useEffect(() => {
    if (!provider) {
      setState((prev) => ({ ...prev, provider: 'none' }));
      return;
    }
    setState((prev) => ({ ...prev, provider: provider.getType() }));
  }, [provider]);

  const checkConnection = useCallback(async () => {
    const p = providerRef.current;
    if (!p) return;

    try {
      const account = await p.getAccount();
      setState((prev) => ({
        ...prev,
        account,
        isConnecting: false,
        error: null,
      }));
    } catch (error: any) {
      setState((prev) => ({
        ...prev,
        account: null,
        isConnecting: false,
        error: error.message,
      }));
    }
  }, []);

  useEffect(() => {
    return subscribeWalletSession(() => {
      void checkConnection();
    });
  }, [checkConnection, provider]);

  const connect = useCallback(async () => {
    const p = providerRef.current;
    if (!p) {
      setState((prev) => ({
        ...prev,
        error: 'No wallet provider available',
      }));
      return;
    }

    setState((prev) => ({ ...prev, isConnecting: true, error: null }));

    try {
      const account = await p.connect();
      setState((prev) => ({
        ...prev,
        account,
        isConnecting: false,
        error: null,
      }));
    } catch (error: any) {
      setState((prev) => ({
        ...prev,
        account: null,
        isConnecting: false,
        error: error.message,
      }));
      throw error;
    }
  }, []);

  const disconnect = useCallback(async () => {
    const p = providerRef.current;
    if (!p) return;

    try {
      await p.disconnect();
      setState((prev) => ({
        ...prev,
        account: null,
        isConnecting: false,
        error: null,
      }));
    } catch (error: any) {
      setState((prev) => ({
        ...prev,
        error: error.message,
      }));
    }
  }, []);

  // Auto-connect on mount if in MiniPay
  useEffect(() => {
    if (!provider) return;

    const env = getEnvironment();

    if (env === 'minipay' && provider.getType() === 'minipay') {
      void connect();
    } else {
      void checkConnection();
    }

    if (provider.onAccountChange) {
      const cleanup = provider.onAccountChange((account) => {
        setState((prev) => ({
          ...prev,
          account,
          isConnecting: false,
        }));
      });
      return cleanup;
    }
  }, [provider, connect, checkConnection]);

  const setProvider = useCallback(
    async (next: StandaloneWalletProviderType) => {
      if (getEnvironment() === 'minipay') {
        return;
      }

      if (state.account) {
        try {
          await disconnect();
        } catch {
          // continue switching even if disconnect fails
        }
      }

      setSelectedStandaloneProvider(next);
      setStandaloneChoice(next);
      setState((prev) => ({
        ...prev,
        provider: next,
        account: null,
        error: null,
      }));
    },
    [disconnect, state.account]
  );

  const signTransaction = useCallback(
    async (transaction: TransactionRequest): Promise<string> => {
      const p = providerRef.current;
      if (!p) throw new Error('No wallet provider available');
      if (!state.account) throw new Error('Wallet not connected');
      return await sendWalletTransaction(() =>
        p.signTransaction({
          ...transaction,
          from: transaction.from || state.account.address,
        })
      );
    },
    [state.account]
  );

  const signMessage = useCallback(
    async (message: string): Promise<string> => {
      const p = providerRef.current;
      if (!p) throw new Error('No wallet provider available');
      if (!state.account) throw new Error('Wallet not connected');
      return await p.signMessage(message);
    },
    [state.account]
  );

  const getAddress = useCallback(async (): Promise<string | null> => {
    const p = providerRef.current;
    if (!p) return null;
    return await p.getAddress();
  }, []);

  const getRpc = useCallback(() => {
    const cid = state.account?.chainId || 42220;
    if (cid === 42220) return process.env.NEXT_PUBLIC_CELO_RPC_URL || 'https://forno.celo.org';
    return process.env.NEXT_PUBLIC_RPC_URL || 'https://forno.celo.org';
  }, [state.account?.chainId]);

  const getTokenBalance = useCallback(
    async (tokenAddress: string, address?: string) => {
      const addr = address || state.account?.address;
      if (!addr) throw new Error('address_required');
      const providerRpc = new JsonRpcProvider(getRpc());
      const erc = new Contract(tokenAddress, ERC20_ABI, providerRpc);
      const [bal, dec, sym] = await Promise.all([
        erc.balanceOf(addr),
        erc.decimals(),
        erc.symbol(),
      ]);
      return { balance: BigInt(bal.toString()), decimals: Number(dec), symbol: String(sym) };
    },
    [state.account?.address, getRpc]
  );

  const sendToken = useCallback(
    async (
      tokenAddress: string,
      to: string,
      amountAtomic: bigint,
      gasLimit?: string,
      gasPrice?: string
    ) => {
      const p = providerRef.current;
      if (!p) throw new Error('No wallet provider available');
      if (!state.account) throw new Error('Wallet not connected');
      const data = encodeTransfer(to, amountAtomic);
      const tx: TransactionRequest = {
        from: state.account.address,
        to: tokenAddress,
        data,
        value: '0x0',
        gasLimit,
        gasPrice,
      };
      return await sendWalletTransaction(() => p.signTransaction(tx));
    },
    [state.account]
  );

  const activeType: WalletProviderType =
    getEnvironment() === 'minipay' && provider?.getType() === 'minipay'
      ? 'minipay'
      : standaloneChoice;

  return {
    ...state,
    provider: activeType,
    selectedProvider: standaloneChoice,
    isConnected: !!state.account,
    address: state.account?.address || null,
    environment: getEnvironment(),
    isMiniPay: getEnvironment() === 'minipay',
    connect,
    disconnect,
    setProvider,
    signTransaction,
    signMessage,
    getAddress,
    checkConnection,
    getTokenBalance,
    sendToken,
    providerInstance: provider,
  };
}
