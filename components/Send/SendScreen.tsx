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
import { Icon, QRIcon, MapMarkerIcon } from '@/components/Icons';

type Step = 'method' | 'address' | 'amount' | 'confirm' | 'processing' | 'success';
type Method = 'address' | 'qr';

export function SendScreen() {
  const router = useRouter();
  const { walletBalance, setWalletBalance, language } = useApp();
  const [step, setStep] = useState<Step>('method');
  const [method, setMethod] = useState<Method>('address');
  const [address, setAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [token, setToken] = useState<'cUSD' | 'USDC' | 'cREAL'>('USDC');
  const [progress, setProgress] = useState(0);

  const labels = {
    en: {
      title: 'Send Payment',
      method: 'Select Method',
      address: 'Wallet Address',
      qr: 'QR Code',
      enterAddress: 'Enter wallet address',
      amount: 'Amount',
      token: 'Token',
      review: 'Review Transaction',
      to: 'To',
      confirm: 'Confirm',
      processing: 'Processing...',
      success: 'Payment Sent Successfully!',
      continue: 'Continue',
    },
    es: {
      title: 'Enviar Pago',
      method: 'Seleccionar Método',
      address: 'Dirección de Billetera',
      qr: 'Código QR',
      enterAddress: 'Ingresa la dirección de billetera',
      amount: 'Cantidad',
      token: 'Token',
      review: 'Revisar Transacción',
      to: 'A',
      confirm: 'Confirmar',
      processing: 'Procesando...',
      success: '¡Pago Enviado Exitosamente!',
      continue: 'Continuar',
    },
  };

  const t = labels[language];

  const handleMethodSelect = (selectedMethod: Method) => {
    setMethod(selectedMethod);
    setStep('address');
  };

  const handleAddressNext = () => {
    if (address) {
      setStep('amount');
    }
  };

  const handleAmountNext = () => {
    const numAmount = parseFloat(amount);
    const balance = walletBalance[token === 'cUSD' ? 'cUSD' : token === 'USDC' ? 'USDC' : 'cREAL'];
    if (numAmount > 0 && numAmount <= balance) {
      setStep('confirm');
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
    const numAmount = parseFloat(amount);
    setWalletBalance({
      ...walletBalance,
      [token === 'cUSD' ? 'cUSD' : token === 'USDC' ? 'USDC' : 'cREAL']:
        walletBalance[token === 'cUSD' ? 'cUSD' : token === 'USDC' ? 'USDC' : 'cREAL'] - numAmount,
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
          <h1 className="text-2xl font-bold text-gray-900 mb-6">{t.title}</h1>

          {step === 'method' && (
            <div className="space-y-4">
              <p className="text-gray-600 mb-4">{t.method}</p>
              <Button
                variant="secondary"
                size="lg"
                fullWidth
                onClick={() => handleMethodSelect('address')}
              >
                <Icon>
                  <MapMarkerIcon />
                </Icon>
                {t.address}
              </Button>
              <Button
                variant="secondary"
                size="lg"
                fullWidth
                onClick={() => handleMethodSelect('qr')}
              >
                <Icon>
                  <QRIcon />
                </Icon>
                {t.qr}
              </Button>
            </div>
          )}

          {step === 'address' && (
            <div className="space-y-4">
              <Input
                label={method === 'qr' ? t.qr : t.address}
                placeholder={t.enterAddress}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
              <Button
                variant="primary"
                size="lg"
                fullWidth
                onClick={handleAddressNext}
                disabled={!address}
              >
                {t.continue}
              </Button>
            </div>
          )}

          {step === 'amount' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t.token}</label>
                <div className="flex gap-2">
                  {(['cUSD', 'USDC', 'cREAL'] as const).map((tkn) => (
                    <Button
                      key={tkn}
                      variant={token === tkn ? 'primary' : 'secondary'}
                      size="sm"
                      onClick={() => setToken(tkn)}
                    >
                      {tkn}
                    </Button>
                  ))}
                </div>
              </div>
              <Input
                type="number"
                label={t.amount}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                min="0"
                step="0.01"
              />
              <p className="text-sm text-gray-600">
                Balance: {walletBalance[token === 'cUSD' ? 'cUSD' : token === 'USDC' ? 'USDC' : 'cREAL'].toFixed(2)} {token}
              </p>
              <Button
                variant="primary"
                size="lg"
                fullWidth
                onClick={handleAmountNext}
                disabled={!amount || parseFloat(amount) <= 0}
              >
                {t.continue}
              </Button>
            </div>
          )}

          {step === 'confirm' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">{t.to}</span>
                  <code className="text-xs font-mono">{address.slice(0, 6)}...{address.slice(-4)}</code>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">{t.amount}</span>
                  <span className="font-semibold">{amount} {token}</span>
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
