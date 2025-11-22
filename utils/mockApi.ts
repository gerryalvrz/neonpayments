/**
 * Mock API Utilities
 * 
 * These functions simulate API calls and can be easily replaced with real API integrations.
 * Each function includes comments indicating where to connect real API endpoints.
 */

import type { 
  User, 
  Transaction, 
  SwapRoute, 
  MercadoPagoAccount,
  SelfVerification,
  Notification 
} from '@/types';

// ============================================================================
// AUTHENTICATION API
// ============================================================================

/**
 * Mock: Authenticate user with email or phone
 * TODO: Replace with real Privy authentication
 * @see https://docs.privy.io/
 */
export async function mockAuthenticate(
  method: 'email' | 'phone',
  identifier: string
): Promise<User> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1500));

  // Mock response
  const walletAddress = '0x' + Array.from({ length: 40 }, () => 
    Math.floor(Math.random() * 16).toString(16)
  ).join('');

  return {
    id: identifier,
    [method]: identifier,
    walletAddress,
    isVerified: true,
    selfVerified: false,
  };
}

/**
 * Real implementation example:
 * 
 * import { usePrivy } from '@privy-io/react-auth';
 * 
 * export async function authenticate(method: 'email' | 'phone', identifier: string) {
 *   const { login } = usePrivy();
 *   await login(method, identifier);
 *   // Get user from Privy
 *   return privyUser;
 * }
 */

// ============================================================================
// MERCADO PAGO API
// ============================================================================

/**
 * Mock: Connect Mercado Pago account via OAuth
 * TODO: Replace with real Mercado Pago OAuth flow
 * @see https://www.mercadopago.com.mx/developers/es/docs/security/oauth
 */
export async function mockConnectMercadoPago(): Promise<MercadoPagoAccount> {
  // Simulate OAuth flow delay
  await new Promise(resolve => setTimeout(resolve, 2000));

  return {
    connected: true,
    balance: 5000, // Mock balance
    accountId: 'mp_' + Math.random().toString(36).substr(2, 9),
  };
}

/**
 * Real implementation example:
 * 
 * export async function connectMercadoPago() {
 *   const redirectUri = `${window.location.origin}/connect-mercado/callback`;
 *   const authUrl = `https://auth.mercadopago.com.mx/authorization?client_id=${CLIENT_ID}&response_type=code&redirect_uri=${redirectUri}`;
 *   window.location.href = authUrl;
 * }
 * 
 * export async function handleMercadoPagoCallback(code: string) {
 *   const response = await fetch('/api/mercado-pago/token', {
 *     method: 'POST',
 *     body: JSON.stringify({ code }),
 *   });
 *   return response.json();
 * }
 */

// ============================================================================
// TRANSACTION API
// ============================================================================

/**
 * Mock: Send a payment transaction
 * TODO: Replace with real blockchain transaction (Celo)
 * @see https://docs.celo.org/
 * 
 * Note: The toAddress parameter can be either:
 * - A hash address (0x...)
 * - A CNS name (e.g., gerry.celo.eth) - will be resolved before sending
 * 
 * CNS resolution is handled in the SendScreen component using utils/cns.ts
 */
export async function mockSendTransaction(
  toAddress: string,
  amount: number,
  token: string,
  fromAddress: string
): Promise<Transaction> {
  // Simulate blockchain transaction delay
  await new Promise(resolve => setTimeout(resolve, 3000));

  const transaction: Transaction = {
    id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type: 'send',
    status: 'completed',
    fromToken: token,
    toToken: token,
    fromAmount: amount,
    toAmount: amount,
    fromAddress,
    toAddress,
    timestamp: Date.now(),
    fee: amount * 0.001, // 0.1% fee
    hash: `0x${Math.random().toString(16).substr(2, 64)}`,
  };

  return transaction;
}

/**
 * Real implementation example:
 * 
 * import { ContractKit, newKitFromWeb3 } from '@celo/contractkit';
 * import Web3 from 'web3';
 * 
 * export async function sendTransaction(toAddress: string, amount: number, token: string) {
 *   const kit = newKitFromWeb3(new Web3(window.ethereum));
 *   const stableToken = await kit.contracts.getStableToken();
 *   const tx = await stableToken.transfer(toAddress, amount).send();
 *   return tx;
 * }
 */

/**
 * Mock: Get transaction history
 * TODO: Replace with real blockchain query or backend API
 */
export async function mockGetTransactions(
  address: string,
  limit = 50
): Promise<Transaction[]> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));

  // Return empty array - in real app, fetch from blockchain or backend
  return [];
}

/**
 * Real implementation example:
 * 
 * export async function getTransactions(address: string) {
 *   // Option 1: Query blockchain directly
 *   const response = await fetch(`https://explorer.celo.org/api?module=account&action=txlist&address=${address}`);
 *   const data = await response.json();
 *   return data.result;
 * 
 *   // Option 2: Use backend API
 *   const response = await fetch(`/api/transactions?address=${address}`);
 *   return response.json();
 * }
 */

// ============================================================================
// SWAP API (Squid Router)
// ============================================================================

/**
 * Mock: Get swap quote from Squid Router
 * TODO: Replace with real Squid Router API
 * @see https://docs.squidrouter.com/
 */
export async function mockGetSwapQuote(
  fromToken: string,
  toToken: string,
  fromAmount: number
): Promise<SwapRoute> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 800));

  // Mock exchange rate (in real app, fetch from Squid Router)
  const rates: Record<string, Record<string, number>> = {
    cUSD: { USDC: 1.0, USDT: 0.18 },
    USDC: { cUSD: 1.0, USDT: 0.18 },
    USDT: { cUSD: 5.5, USDC: 5.5 },
  };

  const rate = rates[fromToken]?.[toToken] || 1;
  const toAmount = fromAmount * rate;
  const fee = toAmount * 0.001; // 0.1% fee

  return {
    fromToken,
    toToken,
    fromAmount,
    toAmount: toAmount - fee,
    rate,
    fee,
    estimatedTime: '~30 seconds',
    route: [fromToken, toToken],
  };
}

/**
 * Real implementation example:
 * 
 * import { Squid } from '@0xsquid/sdk';
 * 
 * const squid = new Squid({
 *   baseUrl: 'https://api.squidrouter.com',
 * });
 * 
 * export async function getSwapQuote(fromToken: string, toToken: string, fromAmount: number) {
 *   const { route } = await squid.getRoute({
 *     fromChain: 'celo',
 *     toChain: 'celo',
 *     fromToken,
 *     toToken,
 *     fromAmount,
 *   });
 *   return route;
 * }
 */

/**
 * Mock: Execute swap transaction
 * TODO: Replace with real Squid Router swap execution
 */
export async function mockExecuteSwap(quote: SwapRoute): Promise<Transaction> {
  // Simulate swap execution delay
  await new Promise(resolve => setTimeout(resolve, 5000));

  const transaction: Transaction = {
    id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type: 'swap',
    status: 'completed',
    fromToken: quote.fromToken,
    toToken: quote.toToken,
    fromAmount: quote.fromAmount,
    toAmount: quote.toAmount,
    timestamp: Date.now(),
    fee: quote.fee,
    hash: `0x${Math.random().toString(16).substr(2, 64)}`,
  };

  return transaction;
}

// ============================================================================
// SELF PROTOCOL API
// ============================================================================

/**
 * Mock: Verify identity with Self Protocol
 * TODO: Replace with real Self Protocol verification
 * @see https://self.xyz/
 */
export async function mockVerifySelf(): Promise<SelfVerification> {
  // Simulate verification delay
  await new Promise(resolve => setTimeout(resolve, 4000));

  return {
    verified: true,
    age: 25,
    country: 'MX',
    sanctionsCheck: true,
    humanityCheck: true,
    proof: 'self_' + Math.random().toString(36).substr(2, 9),
  };
}

/**
 * Real implementation example:
 * 
 * import { SelfSDK } from '@selfxyz/sdk';
 * 
 * const self = new SelfSDK({
 *   apiKey: process.env.SELF_API_KEY,
 * });
 * 
 * export async function verifySelf() {
 *   const verification = await self.verify({
 *     age: true,
 *     country: true,
 *     sanctions: true,
 *     humanity: true,
 *   });
 *   return verification;
 * }
 */

// ============================================================================
// NOTIFICATIONS API
// ============================================================================

/**
 * Mock: Get notifications
 * TODO: Replace with real backend API or WebSocket connection
 */
export async function mockGetNotifications(): Promise<Notification[]> {
  await new Promise(resolve => setTimeout(resolve, 300));
  return [];
}

/**
 * Real implementation example:
 * 
 * // WebSocket connection for real-time notifications
 * const ws = new WebSocket('wss://api.neonpay.mx/notifications');
 * ws.onmessage = (event) => {
 *   const notification = JSON.parse(event.data);
 *   // Update notifications state
 * };
 * 
 * // Or REST API polling
 * export async function getNotifications() {
 *   const response = await fetch('/api/notifications');
 *   return response.json();
 * }
 */

// ============================================================================
// TRANSAK RAMP API
// ============================================================================

/**
 * Mock: Get Transak quote for buying crypto
 * TODO: Replace with real Transak API
 * @see https://docs.transak.com/
 */
export interface TransakQuote {
  fiatAmount: number;
  fiatCurrency: string;
  cryptoAmount: number;
  cryptoCurrency: string;
  exchangeRate: number;
  fee: number;
  totalAmount: number;
}

export async function mockGetTransakQuote(
  fiatAmount: number,
  fiatCurrency: string = 'MXN',
  cryptoCurrency: string = 'USDC'
): Promise<TransakQuote> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 800));

  // Mock exchange rate (1 MXN ≈ 0.055 USDC)
  const exchangeRate = 0.055;
  const cryptoAmount = fiatAmount * exchangeRate;
  const fee = cryptoAmount * 0.025; // 2.5% fee (typical for Transak)
  const totalAmount = fiatAmount;

  return {
    fiatAmount,
    fiatCurrency,
    cryptoAmount: cryptoAmount - fee,
    cryptoCurrency,
    exchangeRate,
    fee,
    totalAmount,
  };
}

/**
 * Mock: Initiate Transak purchase
 * TODO: Replace with real Transak widget integration
 * @see https://docs.transak.com/transak-sdk/integration-guide
 */
export interface TransakPurchase {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  fiatAmount: number;
  fiatCurrency: string;
  cryptoAmount: number;
  cryptoCurrency: string;
  walletAddress: string;
  timestamp: number;
}

export async function mockInitiateTransakPurchase(
  quote: TransakQuote,
  walletAddress: string
): Promise<TransakPurchase> {
  // Simulate opening Transak widget and processing
  await new Promise(resolve => setTimeout(resolve, 2000));

  return {
    id: `transak_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    status: 'processing',
    fiatAmount: quote.fiatAmount,
    fiatCurrency: quote.fiatCurrency,
    cryptoAmount: quote.cryptoAmount,
    cryptoCurrency: quote.cryptoCurrency,
    walletAddress,
    timestamp: Date.now(),
  };
}

/**
 * Mock: Complete Transak purchase (simulate payment completion)
 * TODO: Replace with real Transak webhook/callback handling
 */
export async function mockCompleteTransakPurchase(
  purchaseId: string
): Promise<Transaction> {
  // Simulate payment processing delay
  await new Promise(resolve => setTimeout(resolve, 3000));

  // In real implementation, this would be called via webhook after payment is confirmed
  const transaction: Transaction = {
    id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type: 'topup',
    status: 'completed',
    fromToken: 'MXN',
    toToken: 'USDC',
    fromAmount: 0, // Will be set from purchase data
    toAmount: 0, // Will be set from purchase data
    timestamp: Date.now(),
    fee: 0,
    hash: `0x${Math.random().toString(16).substr(2, 64)}`,
  };

  return transaction;
}

/**
 * Real implementation example:
 * 
 * import Transak from '@transak/transak-sdk';
 * 
 * export function openTransakWidget(walletAddress: string, cryptoCurrency: string) {
 *   const transak = new Transak({
 *     apiKey: process.env.TRANSAK_API_KEY,
 *     environment: 'STAGING', // or 'PRODUCTION'
 *     defaultCryptoCurrency: cryptoCurrency,
 *     walletAddress,
 *     themeColor: '#00FF00',
 *     fiatCurrency: 'MXN',
 *     network: 'celo',
 *   });
 * 
 *   transak.init();
 * 
 *   // Listen for events
 *   transak.on(Transak.EVENTS.TRANSAK_ORDER_SUCCESSFUL, (orderData) => {
 *     // Handle successful order
 *     console.log(orderData);
 *   });
 * 
 *   transak.on(Transak.EVENTS.TRANSAK_ORDER_FAILED, (orderData) => {
 *     // Handle failed order
 *     console.log(orderData);
 *   });
 * }
 */

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Format error message for display
 */
export function formatApiError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unexpected error occurred';
}

/**
 * Simulate network delay (useful for testing)
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

