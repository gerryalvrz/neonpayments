/**
 * human.tech WaaP Wallet Provider
 *
 * Uses window.waap (EIP-1193) after initWaaP from the Waap bridge.
 */

import type {
  WalletProvider,
  WalletAccount,
  TransactionRequest,
  InjectedWalletSession,
  Eip1193Provider,
} from '../types';
import { getWalletSession, subscribeWalletSession } from '../session';

const CELO_CHAIN_ID = 42220;

type WaapWindow = Eip1193Provider & {
  login?: () => Promise<string | null>;
  logout?: () => Promise<void>;
  isConnected?: () => boolean;
};

function getWindowWaap(): WaapWindow | undefined {
  if (typeof window === 'undefined') return undefined;
  return (window as Window & { waap?: WaapWindow }).waap;
}

export class WaapProvider implements WalletProvider {
  private session: InjectedWalletSession | null = null;
  private account: WalletAccount | null = null;

  constructor() {
    this.session = getWalletSession();
    subscribeWalletSession((session) => {
      if (session?.providerType === 'waap' || session === null) {
        this.session = session?.providerType === 'waap' ? session : null;
      }
    });
  }

  getType(): 'waap' {
    return 'waap';
  }

  isAvailable(): boolean {
    if (typeof window === 'undefined') return false;
    return !!(getWindowWaap() || this.session?.ready);
  }

  initialize(session: InjectedWalletSession): void {
    if (session.providerType !== 'waap') return;
    this.session = session;
  }

  private getEip1193(): Eip1193Provider {
    const fromSession = this.session?.eip1193 || getWalletSession()?.eip1193;
    if (fromSession) return fromSession;
    const waap = getWindowWaap();
    if (waap) return waap;
    throw new Error('WaaP not initialized. Wait for WaapProviderWrapper.');
  }

  async connect(): Promise<WalletAccount> {
    const session = this.session || getWalletSession();

    // Prefer bridge login (opens modal + requests accounts once)
    if (session?.providerType === 'waap' && session.login) {
      if (!session.authenticated) {
        await session.login();
      }
    } else {
      const waap = getWindowWaap();
      if (!waap?.login) {
        throw new Error('WaaP not initialized');
      }
      const loginType = await waap.login();
      if (loginType === null) {
        throw new Error('Login cancelled');
      }
      await waap.request({ method: 'eth_requestAccounts' });
    }

    // Re-read session after login (bridge updates address)
    const updated = this.session || getWalletSession();
    const eip1193 = updated?.eip1193 || this.getEip1193();
    const accounts = (await eip1193.request({
      method: 'eth_accounts',
    })) as string[];

    const address = accounts?.[0] || updated?.address;
    if (!address) {
      throw new Error('No accounts found after human.tech login');
    }

    const chainId = await this.getChainId();
    this.account = {
      address,
      isConnected: true,
      chainId,
    };

    return this.account;
  }

  async disconnect(): Promise<void> {
    const session = this.session || getWalletSession();
    if (session?.providerType === 'waap') {
      await session.logout();
    } else {
      const waap = getWindowWaap();
      if (waap?.logout) {
        await waap.logout();
      }
    }
    this.account = null;
  }

  async getAccount(): Promise<WalletAccount | null> {
    try {
      const eip1193 = this.getEip1193();
      const accounts = (await eip1193.request({
        method: 'eth_accounts',
      })) as string[];

      if (!accounts?.length) {
        this.account = null;
        return null;
      }

      const chainId = await this.getChainId();
      this.account = {
        address: accounts[0],
        isConnected: true,
        chainId,
      };
      return this.account;
    } catch {
      this.account = null;
      return null;
    }
  }

  async getAddress(): Promise<string | null> {
    const account = await this.getAccount();
    return account?.address || null;
  }

  async signTransaction(transaction: TransactionRequest): Promise<string> {
    if (!this.account) {
      throw new Error('Wallet not connected');
    }

    const eip1193 = this.getEip1193();
    const txHash = await eip1193.request({
      method: 'eth_sendTransaction',
      params: [
        {
          from: this.account.address,
          to: transaction.to,
          value: transaction.value || '0x0',
          data: transaction.data || '0x',
          gas: transaction.gasLimit,
          gasPrice: transaction.gasPrice,
        },
      ],
    });

    return String(txHash);
  }

  async signMessage(message: string): Promise<string> {
    if (!this.account) {
      throw new Error('Wallet not connected');
    }

    const session = this.session || getWalletSession();
    if (session?.signMessage) {
      return session.signMessage(message);
    }

    const eip1193 = this.getEip1193();
    const signature = await eip1193.request({
      method: 'personal_sign',
      params: [message, this.account.address],
    });

    return String(signature);
  }

  async getChainId(): Promise<number> {
    try {
      const eip1193 = this.getEip1193();
      const chainId = await eip1193.request({ method: 'eth_chainId' });
      return typeof chainId === 'string' ? parseInt(chainId, 16) : Number(chainId);
    } catch {
      return CELO_CHAIN_ID;
    }
  }

  onAccountChange(callback: (account: WalletAccount | null) => void): () => void {
    const eip1193 = (() => {
      try {
        return this.getEip1193();
      } catch {
        return null;
      }
    })();

    if (eip1193?.on && eip1193.removeListener) {
      const handler = async (accounts: unknown) => {
        const list = accounts as string[];
        if (!list?.length) {
          this.account = null;
          callback(null);
        } else {
          callback(await this.getAccount());
        }
      };
      eip1193.on('accountsChanged', handler);
      return () => eip1193.removeListener?.('accountsChanged', handler);
    }

    return subscribeWalletSession(async (session) => {
      if (session?.providerType !== 'waap') {
        callback(null);
        return;
      }
      callback(await this.getAccount());
    });
  }
}
