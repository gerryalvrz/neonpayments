/**
 * Wallet Provider Factory
 * 
 * Creates the appropriate wallet provider based on environment
 */

import { getEnvironment } from '../detection';
import { MiniPayProvider } from './minipay';
import { PrivyProvider } from './privy';
import type { WalletProvider } from '../types';

/**
 * Get the appropriate wallet provider for the current environment
 */
export function getWalletProvider(): WalletProvider | null {
  const environment = getEnvironment();

  if (environment === 'minipay') {
    const provider = new MiniPayProvider();
    if (provider.isAvailable()) {
      return provider;
    }
  }

  // Fallback to Privy for standalone/web
  return new PrivyProvider();
}

/**
 * Get provider by type
 */
export function getProviderByType(type: 'minipay' | 'privy'): WalletProvider {
  if (type === 'minipay') {
    return new MiniPayProvider();
  }
  return new PrivyProvider();
}

export { MiniPayProvider } from './minipay';
export { PrivyProvider } from './privy';

