/**
 * Unified Wallet Hook
 * 
 * React hook that provides a unified interface for wallet operations
 * Works with both MiniPay and Privy providers
 */

'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { getWalletProvider, getProviderByType } from './providers';
import { getEnvironment } from './detection';
import type { WalletProvider, WalletAccount, WalletState, TransactionRequest } from './types';

export function useWallet() {
  const [state, setState] = useState<WalletState>({
    provider: 'none',
    account: null,
    isConnecting: false,
    error: null,
  });

  const provider = useMemo(() => {
    const env = getEnvironment();
    const p = getWalletProvider();
    
    if (p) {
      setState(prev => ({ ...prev, provider: p.getType() }));
      return p;
    }
    
    return null;
  }, []);

  // Auto-connect on mount if in MiniPay
  useEffect(() => {
    if (!provider) return;

    const env = getEnvironment();
    
    // Auto-connect in MiniPay environment
    if (env === 'minipay' && provider.getType() === 'minipay') {
      connect();
    } else {
      // Check if already connected (e.g., Privy session)
      checkConnection();
    }

    // Set up account change listener
    if (provider.onAccountChange) {
      const cleanup = provider.onAccountChange((account) => {
        setState(prev => ({
          ...prev,
          account,
          isConnecting: false,
        }));
      });

      return cleanup;
    }
  }, [provider]);

  const checkConnection = useCallback(async () => {
    if (!provider) return;

    try {
      const account = await provider.getAccount();
      setState(prev => ({
        ...prev,
        account,
        isConnecting: false,
        error: null,
      }));
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        account: null,
        isConnecting: false,
        error: error.message,
      }));
    }
  }, [provider]);

  const connect = useCallback(async () => {
    if (!provider) {
      setState(prev => ({
        ...prev,
        error: 'No wallet provider available',
      }));
      return;
    }

    setState(prev => ({ ...prev, isConnecting: true, error: null }));

    try {
      const account = await provider.connect();
      setState(prev => ({
        ...prev,
        account,
        isConnecting: false,
        error: null,
      }));
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        account: null,
        isConnecting: false,
        error: error.message,
      }));
    }
  }, [provider]);

  const disconnect = useCallback(async () => {
    if (!provider) return;

    try {
      await provider.disconnect();
      setState(prev => ({
        ...prev,
        account: null,
        isConnecting: false,
        error: null,
      }));
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        error: error.message,
      }));
    }
  }, [provider]);

  const signTransaction = useCallback(async (transaction: TransactionRequest): Promise<string> => {
    if (!provider) {
      throw new Error('No wallet provider available');
    }

    if (!state.account) {
      throw new Error('Wallet not connected');
    }

    return await provider.signTransaction(transaction);
  }, [provider, state.account]);

  const signMessage = useCallback(async (message: string): Promise<string> => {
    if (!provider) {
      throw new Error('No wallet provider available');
    }

    if (!state.account) {
      throw new Error('Wallet not connected');
    }

    return await provider.signMessage(message);
  }, [provider, state.account]);

  const getAddress = useCallback(async (): Promise<string | null> => {
    if (!provider) return null;
    return await provider.getAddress();
  }, [provider]);

  return {
    // State
    ...state,
    isConnected: !!state.account,
    address: state.account?.address || null,
    
    // Environment
    environment: getEnvironment(),
    isMiniPay: getEnvironment() === 'minipay',
    
    // Methods
    connect,
    disconnect,
    signTransaction,
    signMessage,
    getAddress,
    checkConnection,
    
    // Provider
    provider,
  };
}

