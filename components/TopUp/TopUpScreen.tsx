'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { useToast } from '@/components/UI/Toast';
import { Container } from '@/components/Layout/Container';
import { BackButton } from '@/components/Layout/BackButton';
import { Card } from '@/components/UI/Card';
import { Button } from '@/components/UI/Button';
import { Input } from '@/components/UI/Input';

export function TopUpScreen() {
  const router = useRouter();
  const { mercadoPago, language } = useApp();
  const { showToast } = useToast();
  const [amount, setAmount] = useState('');

  const labels = {
    en: {
      title: 'Add Funds',
      subtitle: 'On-chain USDC credit from Mercado Pago is not live yet.',
      mercadoTab: 'Mercado Pago',
      amount: 'Amount (MXN)',
      review: 'Review Transaction',
      from: 'From',
      to: 'To',
      rate: 'Rate',
      continue: 'Continue',
      confirm: 'Confirm',
      unavailable: 'Funding to the wallet is not available yet. You can still connect Mercado Pago.',
      mercadoDescription: 'Connect Mercado Pago. Wallet credit ships in a later release.',
    },
    es: {
      title: 'Agregar Fondos',
      subtitle: 'El crédito USDC on-chain desde Mercado Pago aún no está activo.',
      mercadoTab: 'Mercado Pago',
      amount: 'Cantidad (MXN)',
      review: 'Revisar Transacción',
      from: 'De',
      to: 'A',
      rate: 'Tasa',
      continue: 'Continuar',
      confirm: 'Confirmar',
      unavailable: 'El fondeo a la wallet aún no está disponible. Puedes conectar Mercado Pago.',
      mercadoDescription: 'Conecta Mercado Pago. El crédito a la wallet llega en una versión posterior.',
    },
  };

  const t = labels[language];

  const handleAmountSubmit = async () => {
    showToast({
      type: 'info',
      message: t.unavailable,
    });
  };

  return (
    <Container>
      <div className="py-8">
        <BackButton />
        
        <Card padding="xl" className="max-w-md mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-2 tracking-tight">{t.title}</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">{t.subtitle}</p>
          </div>

          <div className="mb-6">
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              {t.mercadoDescription}
            </p>
          </div>

          <div className="space-y-4">
              <Input
                type="number"
                label={t.amount}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                min="0"
                step="0.01"
              />
              {mercadoPago.connected && (
                <p className="text-sm font-medium text-gray-500">
                  Available: <span className="font-bold text-gray-900 dark:text-white financial-number">${mercadoPago.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span> MXN
                </p>
              )}
              {!mercadoPago.connected && (
                <p className="text-sm text-amber-600 dark:text-amber-400">
                  {language === 'es'
                    ? 'Conecta tu cuenta de Mercado Pago para continuar'
                    : 'Connect your Mercado Pago account to continue'}
                </p>
              )}
              <Button
                variant="primary"
                size="lg"
                fullWidth
                onClick={() => router.push('/connect-mercado')}
              >
                {t.mercadoTab}
              </Button>
              <Button
                variant="secondary"
                size="lg"
                fullWidth
                onClick={handleAmountSubmit}
              >
                {t.continue}
              </Button>
            </div>
        </Card>
      </div>
    </Container>
  );
}
