/**
 * Privy Wallet Provider
 * 
 * Integration with Privy for desktop/standalone web app
 */

import type { WalletProvider, WalletAccount, TransactionRequest } from '../types';

export class PrivyProvider implements WalletProvider {
  private privy: any;
  private account: WalletAccount | null = null;

  constructor() {
    // Privy will be initialized via their React hook
    // This provider acts as an adapter
  }

  private getAddressFromPrivy(): string | null {
    if (!this.privy) return null;
    const u = this.privy.user;
    const fromUser = u?.wallet?.address || null;
    const fromWallets = Array.isArray(this.privy.wallets) && this.privy.wallets.length > 0
      ? this.privy.wallets[0]?.address
      : null;
    return fromUser || fromWallets || null;
  }

  getType(): 'privy' {
    return 'privy';
  }

  isAvailable(): boolean {
    // Privy is always available if the PrivyProvider component is mounted
    // We'll check this via the usePrivy hook in the actual implementation
    return true;
  }

  /**
   * Initialize with Privy instance from usePrivy hook
   */
  initialize(privyInstance: any) {
    this.privy = privyInstance;
  }

  async connect(): Promise<WalletAccount> {
    if (!this.privy) {
      throw new Error('Privy not initialized. Call initialize() first.');
    }

    try {
      // Privy handles connection via their UI
      // This is typically called via privy.ready() and privy.authenticated checks
      if (!this.privy.ready) {
        throw new Error('Privy is not ready');
      }

      if (!this.privy.authenticated) {
        // Trigger Privy login
        await this.privy.login();
      }

      const address = this.getAddressFromPrivy();
      if (!address) {
        throw new Error('No wallet address found');
      }

      // Get chain ID (Privy uses Celo by default for this use case)
      const chainId = 42220; // Celo Mainnet

      this.account = {
        address,
        isConnected: true,
        chainId,
      };

      return this.account;
    } catch (error: any) {
      throw new Error(`Failed to connect to Privy: ${error.message}`);
    }
  }

  async disconnect(): Promise<void> {
    if (this.privy) {
      await this.privy.logout();
    }
    this.account = null;
  }

  async getAccount(): Promise<WalletAccount | null> {
    if (!this.privy?.authenticated) {
      this.account = null;
      return null;
    }

    try {
      const address = this.getAddressFromPrivy();
      if (!address) {
        this.account = null;
        return null;
      }

      const chainId = 42220; // Celo Mainnet

      this.account = {
        address,
        isConnected: true,
        chainId,
      };

      return this.account;
    } catch (error) {
      console.error('Error getting Privy account:', error);
      this.account = null;
      return null;
    }
  }

  async getAddress(): Promise<string | null> {
    const account = await this.getAccount();
    return account?.address || this.getAddressFromPrivy();
  }

  async signTransaction(transaction: TransactionRequest): Promise<string> {
    if (!this.account) {
      throw new Error('Wallet not connected');
    }

    if (!this.privy) {
      throw new Error('Privy not initialized');
    }

    try {
      const from = this.account.address;
      const chainIdDec = 42220;
      const chainIdHex = '0xa4ec'; // 42220

      // Prefer embedded wallet EIP-1193 provider if available
      const provider = this.privy?.ethereum || this.privy?.provider;
      if (provider?.request) {
        const txHash = await provider.request({
          method: 'eth_sendTransaction',
          params: [
            {
              from,
              to: transaction.to,
              value: transaction.value || '0x0',
              data: transaction.data || '0x',
              gas: transaction.gasLimit,
              gasPrice: transaction.gasPrice,
              chainId: chainIdHex,
            },
          ],
        });
        return txHash;
      }

      // Fallback to Privy helper if present
      if (this.privy.sendTransaction) {
        const txHash = await this.privy.sendTransaction({
          from,
          to: transaction.to,
          value: transaction.value || '0x0',
          data: transaction.data || '0x',
          gasLimit: transaction.gasLimit,
          gasPrice: transaction.gasPrice,
          chainId: chainIdDec,
        });
        return txHash;
      }

      throw new Error('No transaction method available');
    } catch (error: any) {
      throw new Error(`Failed to sign transaction: ${error.message}`);
    }
  }

  async signMessage(message: string): Promise<string> {
    if (!this.account) {
      throw new Error('Wallet not connected');
    }

    if (!this.privy) {
      throw new Error('Privy not initialized');
    }

    try {
      const signature = await this.privy.signMessage(message);
      return signature;
    } catch (error: any) {
      throw new Error(`Failed to sign message: ${error.message}`);
    }
  }

  async getChainId(): Promise<number> {
    // Privy uses Celo Mainnet (42220) by default for this use case
    return 42220;
  }

  onAccountChange?(callback: (account: WalletAccount | null) => void): () => void {
    // Privy handles account changes internally
    // You would typically use their usePrivy hook to listen for changes
    return () => {};
  }
}
