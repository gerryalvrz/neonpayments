/**
 * Wallet Provider Abstraction Types
 * 
 * Unified interface for wallet providers (MiniPay and Privy)
 */

export type WalletProviderType = 'minipay' | 'privy' | 'none';

export interface WalletAccount {
  address: string;
  isConnected: boolean;
  chainId?: number;
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
}

export interface TransactionRequest {
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

