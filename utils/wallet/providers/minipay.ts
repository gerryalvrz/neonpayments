/**
 * MiniPay Wallet Provider
 *
 * Integration with MiniPay wallet for miniapps
 */

import type { WalletProvider, WalletAccount, TransactionRequest } from '../types';
import { sendWalletTransaction } from '../recoverTxHash';

export class MiniPayProvider implements WalletProvider {
  private account: WalletAccount | null = null;

  getType(): 'minipay' {
    return 'minipay';
  }

  private getEthereum(): any {
    if (typeof window === 'undefined') return undefined;
    return (window as any).ethereum;
  }

  isAvailable(): boolean {
    if (typeof window === 'undefined') return false;

    const ethereum = this.getEthereum();
    return !!(ethereum?.isMiniPay === true || (window as any).minipay || ethereum?.selectedAddress);
  }

  async connect(): Promise<WalletAccount> {
    const ethereum = this.getEthereum();
    if (!this.isAvailable() || !ethereum) {
      throw new Error('MiniPay is not available in this environment');
    }

    try {
      const accounts = await ethereum.request({
        method: 'eth_requestAccounts',
      });

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
    } catch (error: any) {
      throw new Error(`Failed to connect to MiniPay: ${error.message}`);
    }
  }

  async disconnect(): Promise<void> {
    // MiniPay doesn't have a disconnect method typically
    // Just clear local state
    this.account = null;
  }

  async getAccount(): Promise<WalletAccount | null> {
    const ethereum = this.getEthereum();
    if (!this.isAvailable() || !ethereum) {
      return null;
    }

    try {
      const accounts = await ethereum.request({
        method: 'eth_accounts',
      });

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
      // MiniPay requires `from` on eth_sendTransaction; omitting it yields
      // "Invalid sender address null". It also waits internally with viem and
      // can throw "receipt could not be found" after the tx already broadcast.
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
    } catch (error: any) {
      throw new Error(`Failed to sign transaction: ${error.message}`);
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

      return signature;
    } catch (error: any) {
      throw new Error(`Failed to sign message: ${error.message}`);
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

      return parseInt(chainId, 16);
    } catch (error: any) {
      // Default to Celo Mainnet (42220) if chainId can't be determined
      return 42220;
    }
  }

  onAccountChange?(callback: (account: WalletAccount | null) => void): () => void {
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
