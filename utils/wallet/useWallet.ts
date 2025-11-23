/**
 * Unified Wallet Hook
 * 
 * React hook that provides a unified interface for wallet operations
 * Works with both MiniPay and Privy providers
 */

'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { getWalletProvider, getProviderByType } from './providers';
import { getEnvironment } from './detection';
import type { WalletProvider, WalletAccount, WalletState, TransactionRequest } from './types';
import { JsonRpcProvider, Contract } from 'ethers';
import { ERC20_ABI, encodeTransfer } from './erc20';
import { PrivyProvider as PrivyProviderClass } from './providers/privy';

export function useWallet() {
  const [state, setState] = useState<WalletState>({
    provider: 'none',
    account: null,
    isConnecting: false,
    error: null,
  });
  const privy = usePrivy();

  const provider = useMemo(() => {
    const env = getEnvironment();
    const p = getWalletProvider();
    
    if (p) {
      setState(prev => ({ ...prev, provider: p.getType() }));
      return p;
    }
    
    return null;
  }, []);

  useEffect(() => {
    if (!provider) return;
    if (provider.getType() === 'privy') {
      (provider as PrivyProviderClass).initialize(privy);
    }
  }, [provider, privy]);

  useEffect(() => {
    if (!provider) return;
    if (provider.getType() !== 'privy') return;
    if (!privy) return;
    if (!privy.ready) return;
    // Keep account in sync with Privy session
    checkConnection();
  }, [provider, privy.ready, privy.authenticated, privy.user]);

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

  const getRpc = useCallback(() => {
    const cid = state.account?.chainId || 42220;
    if (cid === 42220) return process.env.NEXT_PUBLIC_CELO_RPC_URL || 'https://forno.celo.org';
    return process.env.NEXT_PUBLIC_RPC_URL || 'https://forno.celo.org';
  }, [state.account?.chainId]);

  const getTokenBalance = useCallback(async (tokenAddress: string, address?: string) => {
    const addr = address || state.account?.address;
    if (!addr) throw new Error('address_required');
    const providerRpc = new JsonRpcProvider(getRpc());
    const erc = new Contract(tokenAddress, ERC20_ABI, providerRpc);
    const [bal, dec, sym] = await Promise.all([erc.balanceOf(addr), erc.decimals(), erc.symbol()]);
    return { balance: BigInt(bal.toString()), decimals: Number(dec), symbol: String(sym) };
  }, [state.account?.address, getRpc]);

  const sendToken = useCallback(async (tokenAddress: string, to: string, amountAtomic: bigint, gasLimit?: string, gasPrice?: string) => {
    if (!provider) throw new Error('No wallet provider available');
    if (!state.account) throw new Error('Wallet not connected');
    const data = encodeTransfer(to, amountAtomic);
    const tx: TransactionRequest = { to: tokenAddress, data, value: '0x0', gasLimit, gasPrice };
    return await provider.signTransaction(tx);
  }, [provider, state.account]);

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
    getTokenBalance,
    sendToken,
    
    // Provider
    provider,
  };
}
