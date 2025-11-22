'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { Container } from '@/components/Layout/Container';
import { BackButton } from '@/components/Layout/BackButton';
import { Card } from '@/components/UI/Card';
import { Button } from '@/components/UI/Button';
import { Input } from '@/components/UI/Input';
import { Progress } from '@/components/UI/Loading';
import { Badge } from '@/components/UI/Badge';

type Step = 'input' | 'review' | 'processing' | 'success';

export function TopUpScreen() {
  const router = useRouter();
  const { mercadoPago, walletBalance, setWalletBalance, language } = useApp();
  const [step, setStep] = useState<Step>('input');
  const [amount, setAmount] = useState('');
  const [progress, setProgress] = useState(0);
  const [quote, setQuote] = useState<{ from: number; to: number } | null>(null);

  const labels = {
    en: {
      title: 'Add Funds',
      subtitle: 'Convert MXN to USDC',
      amount: 'Amount (MXN)',
      review: 'Review Transaction',
      from: 'From',
      to: 'To',
      rate: 'Rate',
      processing: 'Processing...',
      success: 'Funds Added Successfully!',
      continue: 'Continue',
      confirm: 'Confirm',
    },
    es: {
      title: 'Agregar Fondos',
      subtitle: 'Convertir MXN a USDC',
      amount: 'Cantidad (MXN)',
      review: 'Revisar Transacción',
      from: 'De',
      to: 'A',
      rate: 'Tasa',
      processing: 'Procesando...',
      success: '¡Fondos Agregados Exitosamente!',
      continue: 'Continuar',
      confirm: 'Confirmar',
    },
  };

  const t = labels[language];

  const handleAmountSubmit = () => {
    const numAmount = parseFloat(amount);
    if (numAmount > 0 && mercadoPago.connected && numAmount <= mercadoPago.balance) {
      // Mock Squid Router quote (1 MXN ≈ 0.055 USDC)
      const usdcAmount = numAmount * 0.055;
      setQuote({ from: numAmount, to: usdcAmount });
      setStep('review');
    }
  };

  const handleConfirm = async () => {
    setStep('processing');
    
    // Simulate transaction
    for (let i = 0; i <= 100; i += 10) {
      await new Promise(resolve => setTimeout(resolve, 200));
      setProgress(i);
    }

    // Update wallet balance
    if (quote) {
      setWalletBalance({
        ...walletBalance,
        USDC: walletBalance.USDC + quote.to,
      });
    }

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
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{t.title}</h1>
          <p className="text-gray-600 mb-6">{t.subtitle}</p>

          {step === 'input' && (
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
                <p className="text-sm text-gray-600">
                  Available: ${mercadoPago.balance.toFixed(2)} MXN
                </p>
              )}
              <Button
                variant="primary"
                size="lg"
                fullWidth
                onClick={handleAmountSubmit}
                disabled={!amount || parseFloat(amount) <= 0 || !mercadoPago.connected}
              >
                {t.continue}
              </Button>
            </div>
          )}

          {step === 'review' && quote && (
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">{t.from}</span>
                  <span className="font-semibold">{quote.from.toFixed(2)} MXN</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">{t.to}</span>
                  <span className="font-semibold">{quote.to.toFixed(2)} USDC</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">{t.rate}</span>
                  <Badge variant="neon">1 MXN ≈ 0.055 USDC</Badge>
                </div>
              </div>
              <Button
                variant="primary"
                size="lg"
                fullWidth
                onClick={handleConfirm}
              >
                {t.confirm}
              </Button>
            </div>
          )}

          {step === 'processing' && (
            <div className="space-y-4">
              <Progress value={progress} />
              <p className="text-center text-gray-600">{t.processing}</p>
            </div>
          )}

          {step === 'success' && (
            <div className="space-y-4 text-center">
              <p className="text-lg font-semibold text-gray-900">{t.success}</p>
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
