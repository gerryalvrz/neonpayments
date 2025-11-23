/**
 * MiniPay Wallet Provider
 * 
 * Integration with MiniPay wallet for miniapps
 */

import type { WalletProvider, WalletAccount, TransactionRequest } from '../types';

export class MiniPayProvider implements WalletProvider {
  private ethereum: any;
  private account: WalletAccount | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.ethereum = (window as any).ethereum;
    }
  }

  getType(): 'minipay' {
    return 'minipay';
  }

  isAvailable(): boolean {
    if (typeof window === 'undefined') return false;
    
    const ethereum = (window as any).ethereum;
    return !!(ethereum?.isMiniPay === true || (window as any).minipay || ethereum?.selectedAddress);
  }

  async connect(): Promise<WalletAccount> {
    if (!this.isAvailable()) {
      throw new Error('MiniPay is not available in this environment');
    }

    try {
      // Request account access
      const accounts = await this.ethereum.request({
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
    if (!this.isAvailable()) {
      return null;
    }

    try {
      const accounts = await this.ethereum.request({
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

  async signTransaction(transaction: TransactionRequest): Promise<string> {
    if (!this.account) {
      throw new Error('Wallet not connected');
    }

    try {
      // MiniPay uses standard EIP-155 transaction format
      const txHash = await this.ethereum.request({
        method: 'eth_sendTransaction',
        params: [transaction],
      });

      return txHash;
    } catch (error: any) {
      throw new Error(`Failed to sign transaction: ${error.message}`);
    }
  }

  async signMessage(message: string): Promise<string> {
    if (!this.account) {
      throw new Error('Wallet not connected');
    }

    try {
      const signature = await this.ethereum.request({
        method: 'personal_sign',
        params: [message, this.account.address],
      });

      return signature;
    } catch (error: any) {
      throw new Error(`Failed to sign message: ${error.message}`);
    }
  }

  async getChainId(): Promise<number> {
    if (!this.isAvailable()) {
      throw new Error('MiniPay is not available');
    }

    try {
      const chainId = await this.ethereum.request({
        method: 'eth_chainId',
      });

      // Convert hex to number
      return parseInt(chainId, 16);
    } catch (error: any) {
      // Default to Celo Mainnet (42220) if chainId can't be determined
      return 42220;
    }
  }

  onAccountChange?(callback: (account: WalletAccount | null) => void): () => void {
    if (!this.isAvailable()) {
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

    this.ethereum.on('accountsChanged', handleAccountsChanged);

    // Return cleanup function
    return () => {
      this.ethereum.removeListener('accountsChanged', handleAccountsChanged);
    };
  }
}
