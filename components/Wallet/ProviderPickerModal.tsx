'use client';

import React, { useEffect, useState } from 'react';
import { Modal } from '@/components/UI/Modal';
import { Button } from '@/components/UI/Button';
import {
  getStandaloneProviders,
  getProviderDisplayName,
} from '@/utils/wallet/selection';
import { preloadWalletSdk } from '@celomx/wallet-embed';
import type { StandaloneWalletProviderType } from '@/utils/wallet/types';

const DESCRIPTIONS: Record<StandaloneWalletProviderType, { en: string; es: string }> = {
  privy: {
    en: 'Email or SMS login with an embedded wallet',
    es: 'Inicio con email o SMS y billetera integrada',
  },
  thirdweb: {
    en: 'In-app wallet via thirdweb (email, phone, social)',
    es: 'Billetera in-app con thirdweb (email, teléfono, social)',
  },
  waap: {
    en: 'human.tech Wallet as a Protocol (EIP-1193)',
    es: 'human.tech Wallet as a Protocol (EIP-1193)',
  },
};

const COPY = {
  en: {
    title: 'Choose wallet provider',
    subtitle:
      'You can change this later in Settings. Each provider creates a different wallet.',
    hint: 'The first time you pick a provider, its secure login can take a few seconds to load.',
    connecting: 'Connecting… a login window will open shortly.',
    current: 'Current',
    cancel: 'Cancel',
    errorFallback: 'Failed to connect',
    retryHint: 'Tap the provider again to finish connecting.',
  },
  es: {
    title: 'Elige proveedor de billetera',
    subtitle:
      'Puedes cambiarlo después en Configuración. Cada proveedor crea una billetera distinta.',
    hint: 'La primera vez que eliges un proveedor, su inicio seguro puede tardar unos segundos en cargar.',
    connecting: 'Conectando… se abrirá una ventana de inicio en breve.',
    current: 'Actual',
    cancel: 'Cancelar',
    errorFallback: 'Error al conectar',
    retryHint: 'Toca el proveedor de nuevo para continuar.',
  },
} as const;

function Spinner() {
  return (
    <svg
      className="animate-spin h-5 w-5 shrink-0 text-acid-lemon-dark dark:text-acid-lemon"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

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
  const t = COPY[language];

  useEffect(() => {
    if (!isOpen) return;
    preloadWalletSdk();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setPending(null);
      setError('');
    }
  }, [isOpen]);

  const handleSelect = async (provider: StandaloneWalletProviderType) => {
    if (pending) return;
    setError('');
    setPending(provider);
    preloadWalletSdk(provider);
    try {
      await onSelect(provider);
      onClose();
    } catch (e: any) {
      setError(e?.message || t.errorFallback);
    } finally {
      setPending(null);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={pending ? () => {} : onClose} title={t.title} size="sm">
      <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">{t.subtitle}</p>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">{t.hint}</p>
      {error && (
        <div className="mb-3 rounded-lg bg-semantic-error/10 px-3 py-2 text-sm text-semantic-error">
          <p>{error}</p>
          <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">{t.retryHint}</p>
        </div>
      )}
      <div className="space-y-2">
        {getStandaloneProviders().map((provider) => {
          const active = selected === provider;
          const isConnectingThis = pending === provider || (connecting && active && pending === null);
          const disabled = pending !== null;
          return (
            <button
              key={provider}
              type="button"
              disabled={disabled}
              aria-busy={isConnectingThis}
              onClick={() => handleSelect(provider)}
              className={`w-full text-left rounded-xl border-2 p-4 transition-colors disabled:cursor-not-allowed ${
                active
                  ? 'border-acid-lemon bg-acid-lemon/10'
                  : 'border-gray-200 dark:border-gray-700 hover:border-acid-lemon/60'
              } ${disabled && !isConnectingThis ? 'opacity-50' : ''}`}
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {getProviderDisplayName(provider)}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                    {isConnectingThis ? t.connecting : DESCRIPTIONS[provider][language]}
                  </p>
                </div>
                {isConnectingThis ? (
                  <Spinner />
                ) : active ? (
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-200">
                    {t.current}
                  </span>
                ) : null}
              </div>
            </button>
          );
        })}
      </div>
      <div className="mt-4">
        <Button variant="secondary" size="md" fullWidth onClick={onClose} disabled={!!pending}>
          {t.cancel}
        </Button>
      </div>
    </Modal>
  );
}
