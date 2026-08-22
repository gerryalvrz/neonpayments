/**
 * Wallet Provider Abstraction Types
 *
 * Unified interface for wallet providers (MiniPay, Privy, thirdweb, human.tech WaaP)
 */

export type StandaloneWalletProviderType = 'privy' | 'thirdweb' | 'waap';

export type WalletProviderType = 'minipay' | StandaloneWalletProviderType | 'none';

export interface WalletAccount {
  address: string;
  isConnected: boolean;
  chainId?: number;
}

export interface Eip1193Provider {
  request(args: { method: string; params?: unknown[] | Record<string, unknown> }): Promise<unknown>;
  on?(event: string, handler: (...args: unknown[]) => void): void;
  removeListener?(event: string, handler: (...args: unknown[]) => void): void;
}

/**
 * Session injected by vendor React bridges into class adapters.
 * Keeps useWallet free of vendor hook imports.
 */
export interface InjectedWalletSession {
  providerType: StandaloneWalletProviderType;
  ready: boolean;
  authenticated: boolean;
  address: string | null;
  chainId?: number;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  eip1193: Eip1193Provider | null;
  signMessage?: (message: string) => Promise<string>;
}

export interface WalletProvider {
  /**
   * Get the provider type
   */
  getType(): WalletProviderType;

  /**
   * Check if the provider is available in the current environment
   */
  isAvailable(): boolean;

  /**
   * Connect to the wallet
   */
  connect(): Promise<WalletAccount>;

  /**
   * Disconnect from the wallet
   */
  disconnect(): Promise<void>;

  /**
   * Get the current account if connected
   */
  getAccount(): Promise<WalletAccount | null>;

  /**
   * Get the wallet address
   */
  getAddress(): Promise<string | null>;

  /**
   * Sign a transaction
   */
  signTransaction(transaction: TransactionRequest): Promise<string>;

  /**
   * Sign a message
   */
  signMessage(message: string): Promise<string>;

  /**
   * Get the current chain ID
   */
  getChainId(): Promise<number>;

  /**
   * Switch chain (if supported)
   */
  switchChain?(chainId: number): Promise<void>;

  /**
   * Listen for account changes
   */
  onAccountChange?(callback: (account: WalletAccount | null) => void): () => void;

  /**
   * Optional: inject vendor session from a React bridge
   */
  initialize?(session: InjectedWalletSession): void;
}

export interface TransactionRequest {
  from?: string;
  to: string;
  value?: string; // in wei
  data?: string;
  gasLimit?: string;
  gasPrice?: string;
}

export interface WalletState {
  provider: WalletProviderType;
  account: WalletAccount | null;
  isConnecting: boolean;
  error: string | null;
}
