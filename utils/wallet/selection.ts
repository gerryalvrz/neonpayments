/**
 * Standalone wallet provider selection (persisted).
 * MiniPay is never stored here — it auto-wins when detected.
 */

import type { StandaloneWalletProviderType } from './types';

export const WALLET_PROVIDER_STORAGE_KEY = 'neonpay.walletProvider';

export const STANDALONE_PROVIDERS: StandaloneWalletProviderType[] = [
  'privy',
  'thirdweb',
  'waap',
];

export const DEFAULT_STANDALONE_PROVIDER: StandaloneWalletProviderType = 'privy';

export function isStandaloneWalletProvider(
  value: unknown
): value is StandaloneWalletProviderType {
  return value === 'privy' || value === 'thirdweb' || value === 'waap';
}

export function getSelectedStandaloneProvider(): StandaloneWalletProviderType {
  if (typeof window === 'undefined') {
    return DEFAULT_STANDALONE_PROVIDER;
  }

  try {
    const raw = localStorage.getItem(WALLET_PROVIDER_STORAGE_KEY);
    if (isStandaloneWalletProvider(raw)) {
      return raw;
    }
  } catch {
    // ignore storage errors
  }

  return DEFAULT_STANDALONE_PROVIDER;
}

export function setSelectedStandaloneProvider(
  provider: StandaloneWalletProviderType
): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(WALLET_PROVIDER_STORAGE_KEY, provider);
  } catch {
    // ignore storage errors
  }

  window.dispatchEvent(
    new CustomEvent('neonpay:wallet-provider-changed', { detail: provider })
  );
}

export function getProviderDisplayName(
  provider: StandaloneWalletProviderType | 'minipay'
): string {
  switch (provider) {
    case 'privy':
      return 'Privy';
    case 'thirdweb':
      return 'thirdweb';
    case 'waap':
      return 'human.tech';
    case 'minipay':
      return 'MiniPay';
    default:
      return provider;
  }
}
