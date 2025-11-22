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
  USDT: number;
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

export type TransactionType = 'send' | 'receive' | 'swap' | 'topup' | 'withdraw' | 'service';
export type TransactionStatus = 'pending' | 'completed' | 'failed' | 'cancelled';

export interface Transaction {
  id: string;
  type: TransactionType;
  status: TransactionStatus;
  fromToken: string;
  toToken: string;
  fromAmount: number;
  toAmount: number;
  fromAddress?: string;
  toAddress?: string;
  timestamp: number;
  fee?: number;
  hash?: string;
  description?: string;
}

export interface Notification {
  id: string;
  type: 'transaction' | 'verification' | 'system' | 'security';
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
  actionUrl?: string;
}

export interface UserSettings {
  currency: 'MXN' | 'USD';
  language: Language;
  notifications: {
    email: boolean;
    push: boolean;
    transaction: boolean;
    security: boolean;
  };
  security: {
    twoFactorEnabled: boolean;
    biometricEnabled: boolean;
  };
}

export interface SwapRoute {
  fromToken: string;
  toToken: string;
  fromAmount: number;
  toAmount: number;
  rate: number;
  fee: number;
  estimatedTime: string;
  route: string[];
}

export type ServiceCategory = 'mobile' | 'utilities' | 'internet' | 'transport' | 'other';

export interface ServiceProvider {
  id: string;
  name: string;
  category: ServiceCategory;
  icon?: string;
  requiresAccountNumber?: boolean;
  requiresPhoneNumber?: boolean;
  minAmount?: number;
  maxAmount?: number;
}

export interface ServicePayment {
  id: string;
  providerId: string;
  amount: number;
  accountNumber?: string;
  phoneNumber?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  timestamp: number;
  transactionId?: string;
}


