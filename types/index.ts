export interface User {
  id: string;
  email?: string;
  phone?: string;
  walletAddress?: string;
  isVerified: boolean;
  selfVerified?: boolean;
}

export interface MercadoPagoAccount {
  connected: boolean;
  balance: number; // MXN
  accountId?: string;
}

export interface WalletBalance {
  cUSD: number;
  USDC: number;
  cREAL: number;
}

export interface SwapQuote {
  fromAmount: number;
  fromCurrency: string;
  toAmount: number;
  toCurrency: string;
  route: string[];
  estimatedTime: string;
}

export interface SelfVerification {
  verified: boolean;
  age?: number;
  country?: string;
  sanctionsCheck?: boolean;
  humanityCheck?: boolean;
  proof?: string;
}

export type FlowStep = 
  | 'home'
  | 'auth'
  | 'connect-mercado'
  | 'topup'
  | 'swap'
  | 'verify-self'
  | 'send'
  | 'payment';

export type Language = 'en' | 'es';


