'use client';

/**
 * Mounts exactly one wallet SDK for standalone mode based on persisted selection.
 * MiniPay environments skip all embedded SDK wrappers.
 *
 * Dynamic SDK chunks can fail after a stale/restarted dev server (ChunkLoadError).
 * We catch that and fall back to Privy so the app stays usable.
 */

import React, { Component, useEffect, useState, type ReactNode } from 'react';
import dynamic from 'next/dynamic';
import { getEnvironment } from '@/utils/wallet/detection';
import {
  DEFAULT_STANDALONE_PROVIDER,
  getSelectedStandaloneProvider,
  setSelectedStandaloneProvider,
} from '@/utils/wallet/selection';
import type { StandaloneWalletProviderType } from '@/utils/wallet/types';

function PassThrough({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

function isChunkLoadError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const err = error as { name?: string; message?: string };
  return (
    err.name === 'ChunkLoadError' ||
    /Loading chunk [\w-]+ failed/i.test(err.message || '') ||
    /Failed to fetch dynamically imported module/i.test(err.message || '')
  );
}

function loadWalletSdk(
  label: string,
  importer: () => Promise<{ default: React.ComponentType<{ children: ReactNode }> }>
) {
  return dynamic(
    () =>
      importer().catch((error: unknown) => {
        console.error(`[WalletSdkShell] Failed to load ${label} SDK chunk`, error);
        return { default: PassThrough };
      }),
    { ssr: false }
  );
}

const PrivyProviderWrapper = loadWalletSdk('Privy', () =>
  import('./PrivyProvider').then((m) => ({ default: m.PrivyProviderWrapper }))
);

const ThirdwebProviderWrapper = loadWalletSdk('thirdweb', () =>
  import('./ThirdwebProvider').then((m) => ({
    default: m.ThirdwebProviderWrapper,
  }))
);

const WaapProviderWrapper = loadWalletSdk('WaaP', () =>
  import('./WaapProvider').then((m) => ({ default: m.WaapProviderWrapper }))
);

type BoundaryProps = {
  provider: StandaloneWalletProviderType;
  onChunkError: (provider: StandaloneWalletProviderType) => void;
  children: ReactNode;
};

type BoundaryState = { failed: boolean };

class WalletSdkErrorBoundary extends Component<BoundaryProps, BoundaryState> {
  state: BoundaryState = { failed: false };

  static getDerivedStateFromError(): BoundaryState {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    if (isChunkLoadError(error)) {
      this.props.onChunkError(this.props.provider);
    } else {
      console.error('[WalletSdkShell] Wallet SDK render error', error);
    }
  }

  componentDidUpdate(prevProps: BoundaryProps) {
    if (prevProps.provider !== this.props.provider && this.state.failed) {
      this.setState({ failed: false });
    }
  }

  render() {
    if (this.state.failed) {
      return <PrivyProviderWrapper>{this.props.children}</PrivyProviderWrapper>;
    }
    return this.props.children;
  }
}

export function WalletSdkShell({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [selected, setSelected] = useState<StandaloneWalletProviderType>(
    DEFAULT_STANDALONE_PROVIDER
  );
  const [isMiniPay, setIsMiniPay] = useState(false);

  useEffect(() => {
    setMounted(true);
    setIsMiniPay(getEnvironment() === 'minipay');
    setSelected(getSelectedStandaloneProvider());

    const onChange = (event: Event) => {
      const detail = (event as CustomEvent<StandaloneWalletProviderType>).detail;
      if (detail) {
        setSelected(detail);
      } else {
        setSelected(getSelectedStandaloneProvider());
      }
    };

    window.addEventListener('neonpay:wallet-provider-changed', onChange);
    return () => window.removeEventListener('neonpay:wallet-provider-changed', onChange);
  }, []);

  const handleChunkError = (provider: StandaloneWalletProviderType) => {
    console.warn(
      `[WalletSdkShell] ${provider} chunk failed; falling back to ${DEFAULT_STANDALONE_PROVIDER}. Hard-refresh if this persists.`
    );
    if (provider !== DEFAULT_STANDALONE_PROVIDER) {
      setSelectedStandaloneProvider(DEFAULT_STANDALONE_PROVIDER);
      setSelected(DEFAULT_STANDALONE_PROVIDER);
    }
  };

  // Avoid SSR mismatch / premature SDK init
  if (!mounted) {
    return <>{children}</>;
  }

  if (isMiniPay) {
    return <>{children}</>;
  }

  let sdk: ReactNode;
  if (selected === 'thirdweb') {
    sdk = <ThirdwebProviderWrapper>{children}</ThirdwebProviderWrapper>;
  } else if (selected === 'waap') {
    sdk = <WaapProviderWrapper>{children}</WaapProviderWrapper>;
  } else {
    sdk = <PrivyProviderWrapper>{children}</PrivyProviderWrapper>;
  }

  return (
    <WalletSdkErrorBoundary provider={selected} onChunkError={handleChunkError}>
      {sdk}
    </WalletSdkErrorBoundary>
  );
}
