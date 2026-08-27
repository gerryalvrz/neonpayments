'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/UI/Modal';
import { Button } from '@/components/UI/Button';
import {
  getStandaloneProviders,
  getProviderDisplayName,
} from '@/utils/wallet/selection';
import type { StandaloneWalletProviderType } from '@/utils/wallet/types';

const DESCRIPTIONS: Record<StandaloneWalletProviderType, { en: string; es: string }> = {
  privy: {
    en: 'Email, SMS, passkey, or connect your own wallet',
    es: 'Email, SMS, passkey, o conecta tu propia billetera',
  },
  thirdweb: {
    en: 'Email, social, or connect MetaMask / WalletConnect',
    es: 'Email, redes, o conecta MetaMask / WalletConnect',
  },
  waap: {
    en: 'Email, social, or connect your own wallet',
    es: 'Email, redes, o conecta tu propia billetera',
  },
};

interface ProviderPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  selected: StandaloneWalletProviderType;
  language?: 'en' | 'es';
  connecting?: boolean;
  onSelect: (provider: StandaloneWalletProviderType) => void | Promise<void>;
}

export function ProviderPickerModal({
  isOpen,
  onClose,
  selected,
  language = 'en',
  connecting = false,
  onSelect,
}: ProviderPickerModalProps) {
  const [pending, setPending] = useState<StandaloneWalletProviderType | null>(null);
  const [error, setError] = useState('');

  const title = language === 'es' ? 'Elige proveedor de billetera' : 'Choose wallet provider';
  const subtitle =
    language === 'es'
      ? 'Puedes cambiarlo después en Configuración. Cada proveedor crea una billetera distinta.'
      : 'You can change this later in Settings. Each provider creates a different wallet.';

  const handleSelect = async (provider: StandaloneWalletProviderType) => {
    setError('');
    setPending(provider);
    try {
      await onSelect(provider);
      onClose();
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : '';
      setError(message || (language === 'es' ? 'Error al conectar' : 'Failed to connect'));
    } finally {
      setPending(null);
    }
  };

  const busy = connecting || pending !== null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      closeOnOverlay={!busy}
      showCloseButton={!busy}
    >
      <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">{subtitle}</p>
      {error && <div className="mb-3 text-sm text-semantic-error">{error}</div>}
      <div className="space-y-2">
        {getStandaloneProviders().map((provider) => {
          const active = selected === provider;
          const loading = connecting || pending === provider;
          return (
            <button
              key={provider}
              type="button"
              disabled={busy}
              onClick={() => handleSelect(provider)}
              className={`w-full text-left rounded-xl border-2 p-4 transition-colors ${
                active
                  ? 'border-acid-lemon bg-acid-lemon/10'
                  : 'border-gray-200 dark:border-gray-700 hover:border-acid-lemon/60'
              } disabled:opacity-60`}
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {getProviderDisplayName(provider)}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                    {DESCRIPTIONS[provider][language]}
                  </p>
                </div>
                  {loading ? (
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-200">
                      {language === 'es' ? 'Conectando…' : 'Connecting…'}
                    </span>
                  ) : active ? (
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-200">
                      {language === 'es' ? 'Actual' : 'Current'}
                    </span>
                  ) : null}
              </div>
            </button>
          );
        })}
      </div>
      <div className="mt-4">
        <Button variant="secondary" size="md" fullWidth onClick={onClose} disabled={busy}>
          {language === 'es' ? 'Cancelar' : 'Cancel'}
        </Button>
      </div>
    </Modal>
  );
}
