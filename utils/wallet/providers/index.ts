/**
 * Wallet Provider Factory
 *
 * Creates the appropriate wallet provider based on environment + user selection
 */

import { getEnvironment } from '../detection';
import { getSelectedStandaloneProvider } from '../selection';
import { MiniPayProvider } from './minipay';
import { PrivyProvider } from './privy';
import { ThirdwebWalletProvider } from './thirdweb';
import { WaapProvider } from './waap';
import type { StandaloneWalletProviderType, WalletProvider } from '../types';

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

  return getProviderByType(getSelectedStandaloneProvider());
}

/**
 * Get provider by type
 */
export function getProviderByType(
  type: 'minipay' | StandaloneWalletProviderType
): WalletProvider {
  if (type === 'minipay') {
    return new MiniPayProvider();
  }
  if (type === 'thirdweb') {
    return new ThirdwebWalletProvider();
  }
  if (type === 'waap') {
    return new WaapProvider();
  }
  return new PrivyProvider();
}

export { MiniPayProvider } from './minipay';
export { PrivyProvider } from './privy';
export { ThirdwebWalletProvider } from './thirdweb';
export { WaapProvider } from './waap';
