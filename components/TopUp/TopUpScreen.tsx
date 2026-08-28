'use client';

import React from 'react';
import { useApp } from '@/context/AppContext';
import { Container } from '@/components/Layout/Container';
import { BackButton } from '@/components/Layout/BackButton';
import { Card } from '@/components/UI/Card';

export function TopUpScreen() {
  const { language } = useApp();

  const labels = {
    en: {
      title: 'Add Funds',
      comingSoon: 'Coming soon',
      body: 'A new way to fund your wallet is on the way.',
    },
    es: {
      title: 'Agregar Fondos',
      comingSoon: 'Muy pronto',
      body: 'Una nueva forma de fondear tu wallet está en camino.',
    },
  };

  const t = labels[language];

  return (
    <Container>
      <div className="py-8">
        <BackButton />

        <Card padding="xl" className="max-w-md mx-auto">
          <div className="flex flex-col items-center justify-center text-center py-12 space-y-4">
            <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
              {t.title}
            </h1>
            <span className="inline-flex items-center rounded-full border border-acid-lemon/40 bg-acid-lemon/10 px-4 py-1.5 text-sm font-semibold text-gray-900 dark:text-white">
              {t.comingSoon}
            </span>
            <p className="max-w-xs text-sm text-gray-500 dark:text-gray-400">{t.body}</p>
          </div>
        </Card>
      </div>
    </Container>
  );
}
