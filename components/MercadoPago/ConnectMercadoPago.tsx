'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { Container } from '@/components/Layout/Container';
import { BackButton } from '@/components/Layout/BackButton';
import { Card } from '@/components/UI/Card';
import { Button } from '@/components/UI/Button';
import { Progress } from '@/components/UI/Loading';
import { Icon, CreditCardIcon, CheckCircleIcon } from '@/components/Icons';

export function ConnectMercadoPago() {
  const router = useRouter();
  const { setMercadoPago, language } = useApp();
  const [step, setStep] = useState<'connect' | 'processing' | 'success'>('connect');
  const [progress, setProgress] = useState(0);

  const labels = {
    en: {
      title: 'Connect Mercado Pago',
      subtitle: 'Link your Mercado Pago account to add funds',
      connect: 'Connect Account',
      processing: 'Connecting...',
      success: 'Connected Successfully!',
      balance: 'Balance',
      continue: 'Continue',
    },
    es: {
      title: 'Conectar Mercado Pago',
      subtitle: 'Vincula tu cuenta de Mercado Pago para agregar fondos',
      connect: 'Conectar Cuenta',
      processing: 'Conectando...',
      success: '¡Conectado Exitosamente!',
      balance: 'Saldo',
      continue: 'Continuar',
    },
  };

  const t = labels[language];

  const handleConnect = async () => {
    setStep('processing');
    
    // Simulate OAuth flow
    for (let i = 0; i <= 100; i += 10) {
      await new Promise(resolve => setTimeout(resolve, 200));
      setProgress(i);
    }

    // Mock connection
    setMercadoPago({
      connected: true,
      balance: 5000,
      accountId: 'mp_' + Math.random().toString(36).substr(2, 9),
    });

    setStep('success');
  };

  const handleContinue = () => {
    router.push('/');
  };

  return (
    <Container>
      <div className="py-8">
        <BackButton />
        
        <Card padding="lg" className="max-w-md mx-auto">
          <div className="text-center mb-6">
            <Icon size="xl" color="neon" className="mb-4">
              <CreditCardIcon />
            </Icon>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{t.title}</h1>
            <p className="text-gray-600">{t.subtitle}</p>
          </div>

          {step === 'connect' && (
            <Button
              variant="primary"
              size="lg"
              fullWidth
              onClick={handleConnect}
            >
              {t.connect}
            </Button>
          )}

          {step === 'processing' && (
            <div className="space-y-4">
              <Progress value={progress} />
              <p className="text-center text-gray-600">{t.processing}</p>
            </div>
          )}

          {step === 'success' && (
            <div className="space-y-4">
              <div className="text-center">
                <Icon size="xl" color="success" className="mb-2">
                  <CheckCircleIcon />
                </Icon>
                <p className="text-lg font-semibold text-gray-900">{t.success}</p>
                <p className="text-sm text-gray-600 mt-2">
                  {t.balance}: $5,000.00 MXN
                </p>
              </div>
              <Button
                variant="primary"
                size="lg"
                fullWidth
                onClick={handleContinue}
              >
                {t.continue}
              </Button>
            </div>
          )}
        </Card>
      </div>
    </Container>
  );
}
