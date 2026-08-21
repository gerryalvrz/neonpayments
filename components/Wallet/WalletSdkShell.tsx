'use client';

/**
 * Mounts exactly one wallet SDK for standalone mode based on persisted selection.
 * MiniPay environments skip all embedded SDK wrappers.
 */

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { getEnvironment } from '@/utils/wallet/detection';
import { getSelectedStandaloneProvider } from '@/utils/wallet/selection';
import type { StandaloneWalletProviderType } from '@/utils/wallet/types';

const PrivyProviderWrapper = dynamic(
  () =>
    import('./PrivyProvider').then((m) => ({ default: m.PrivyProviderWrapper })),
  { ssr: false }
);

const ThirdwebProviderWrapper = dynamic(
  () =>
    import('./ThirdwebProvider').then((m) => ({
      default: m.ThirdwebProviderWrapper,
    })),
  { ssr: false }
);

const WaapProviderWrapper = dynamic(
  () =>
    import('./WaapProvider').then((m) => ({ default: m.WaapProviderWrapper })),
  { ssr: false }
);

export function WalletSdkShell({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [selected, setSelected] = useState<StandaloneWalletProviderType>('privy');
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

  // Avoid SSR mismatch / premature SDK init
  if (!mounted) {
    return <>{children}</>;
  }

  if (isMiniPay) {
    return <>{children}</>;
  }

  if (selected === 'thirdweb') {
    return <ThirdwebProviderWrapper>{children}</ThirdwebProviderWrapper>;
  }

  if (selected === 'waap') {
    return <WaapProviderWrapper>{children}</WaapProviderWrapper>;
  }

  return <PrivyProviderWrapper>{children}</PrivyProviderWrapper>;
}
