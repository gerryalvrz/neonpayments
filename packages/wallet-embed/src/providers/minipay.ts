/**
 * MiniPay Wallet Provider
 *
 * Integration with MiniPay wallet for miniapps
 */

import { getWalletEmbedConfig } from '../config';
import { sendWalletTransaction } from '../recoverTxHash';
import type { WalletProvider, WalletAccount, TransactionRequest } from '../types';

/** MiniPay / injected providers often reject with plain objects, not Error. */
function formatProviderError(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === 'string' && error.trim()) return error;
  if (error && typeof error === 'object') {
    const o = error as Record<string, unknown>;
    const nested = o.error;
    const candidates = [
      o.message,
      o.msg,
      o.reason,
      o.code != null ? `code ${String(o.code)}` : '',
      nested instanceof Error ? nested.message : null,
      nested && typeof nested === 'object'
        ? (nested as { message?: unknown }).message
        : nested,
    ];
    for (const value of candidates) {
      if (typeof value === 'string' && value.trim() && value !== '[object Object]') {
        return value.trim();
      }
    }
    try {
      const json = JSON.stringify(error);
      if (json && json !== '{}') return json;
    } catch {
      // ignore
    }
  }
  return 'Unknown MiniPay error';
}

export class MiniPayProvider implements WalletProvider {
  private account: WalletAccount | null = null;

  getType(): 'minipay' {
    return 'minipay';
  }

  private getEthereum(): { request: (args: unknown) => Promise<unknown>; on?: Function; removeListener?: Function; isMiniPay?: boolean; selectedAddress?: string } | undefined {
    if (typeof window === 'undefined') return undefined;
    return (window as Window & { ethereum?: ReturnType<MiniPayProvider['getEthereum']> }).ethereum;
  }

  isAvailable(): boolean {
    if (typeof window === 'undefined') return false;

    const ethereum = this.getEthereum();
    // Only real MiniPay — never treat Rabby/MetaMask selectedAddress as MiniPay.
    return !!(
      ethereum?.isMiniPay === true ||
      (window as Window & { minipay?: unknown }).minipay
    );
  }

  async connect(): Promise<WalletAccount> {
    const ethereum = this.getEthereum();
    if (!this.isAvailable() || !ethereum) {
      throw new Error('MiniPay is not available in this environment');
    }

    try {
      const accounts = (await ethereum.request({
        method: 'eth_requestAccounts',
      })) as string[];

      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts found');
      }

      const address = accounts[0];
      const chainId = await this.getChainId();

      this.account = {
        address,
        isConnected: true,
        chainId,
      };

      return this.account;
    } catch (error: unknown) {
      throw new Error(`Failed to connect to MiniPay: ${formatProviderError(error)}`);
    }
  }

  async disconnect(): Promise<void> {
    this.account = null;
  }

  async getAccount(): Promise<WalletAccount | null> {
    const ethereum = this.getEthereum();
    if (!this.isAvailable() || !ethereum) {
      return null;
    }

    try {
      const accounts = (await ethereum.request({
        method: 'eth_accounts',
      })) as string[];

      if (accounts && accounts.length > 0) {
        const address = accounts[0];
        const chainId = await this.getChainId();

        this.account = {
          address,
          isConnected: true,
          chainId,
        };

        return this.account;
      }
    } catch (error) {
      console.error('Error getting MiniPay account:', error);
    }

    this.account = null;
    return null;
  }

  async getAddress(): Promise<string | null> {
    const account = await this.getAccount();
    return account?.address || null;
  }

  private async resolveAddress(preferred?: string): Promise<string> {
    if (preferred) return preferred;
    if (this.account?.address) return this.account.address;

    const account = await this.getAccount();
    if (account?.address) return account.address;

    throw new Error('Wallet not connected');
  }

  async signTransaction(transaction: TransactionRequest): Promise<string> {
    const ethereum = this.getEthereum();
    if (!ethereum) {
      throw new Error('MiniPay is not available');
    }

    const from = await this.resolveAddress(transaction.from);

    try {
      const tx: Record<string, string> = {
        from,
        to: transaction.to,
        value: transaction.value || '0x0',
        data: transaction.data || '0x',
      };
      if (transaction.gasLimit) tx.gas = transaction.gasLimit;
      if (transaction.gasPrice) tx.gasPrice = transaction.gasPrice;

      return await sendWalletTransaction(async () => {
        const txHash = await ethereum.request({
          method: 'eth_sendTransaction',
          params: [tx],
        });
        return String(txHash);
      });
    } catch (error: unknown) {
      throw new Error(`Failed to sign transaction: ${formatProviderError(error)}`);
    }
  }

  async signMessage(message: string): Promise<string> {
    const ethereum = this.getEthereum();
    if (!ethereum) {
      throw new Error('MiniPay is not available');
    }

    const from = await this.resolveAddress();

    try {
      const signature = await ethereum.request({
        method: 'personal_sign',
        params: [message, from],
      });

      return String(signature);
    } catch (error: unknown) {
      throw new Error(`Failed to sign message: ${formatProviderError(error)}`);
    }
  }

  async getChainId(): Promise<number> {
    const ethereum = this.getEthereum();
    if (!ethereum) {
      throw new Error('MiniPay is not available');
    }

    try {
      const chainId = await ethereum.request({
        method: 'eth_chainId',
      });

      return parseInt(String(chainId), 16);
    } catch {
      return getWalletEmbedConfig().chain.id;
    }
  }

  onAccountChange(callback: (account: WalletAccount | null) => void): () => void {
    const ethereum = this.getEthereum();
    if (!ethereum?.on) {
      return () => {};
    }

    const handleAccountsChanged = async (accounts: string[]) => {
      if (accounts.length === 0) {
        this.account = null;
        callback(null);
      } else {
        const account = await this.getAccount();
        callback(account);
      }
    };

    ethereum.on('accountsChanged', handleAccountsChanged);

    return () => {
      ethereum.removeListener?.('accountsChanged', handleAccountsChanged);
    };
  }
}
