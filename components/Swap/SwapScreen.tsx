'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { useToast } from '@/components/UI/Toast';
import { Container } from '@/components/Layout/Container';
import { BackButton } from '@/components/Layout/BackButton';
import { Card } from '@/components/UI/Card';
import { Button } from '@/components/UI/Button';
import { Input } from '@/components/UI/Input';
import { Select } from '@/components/UI/Select';
import { Badge } from '@/components/UI/Badge';
import { Progress } from '@/components/UI/Loading';
import { Icon, SwapIcon, ArrowDownIcon } from '@/components/Icons';
import type { SwapRoute, Transaction } from '@/types';

type Step = 'input' | 'review' | 'processing' | 'success';

const TOKENS = ['cUSD', 'USDC', 'USDT'] as const;
type Token = typeof TOKENS[number];

// Mock exchange rates
const EXCHANGE_RATES: Record<string, Record<string, number>> = {
  cUSD: { USDC: 1.0, USDT: 1.0 },
  USDC: { cUSD: 1.0, USDT: 1.0 },
  USDT: { cUSD: 1.0, USDC: 1.0 },
};

export function SwapScreen() {
  const router = useRouter();
  const { walletBalance, setWalletBalance, addTransaction, language } = useApp();
  const { showToast } = useToast();
  const [step, setStep] = useState<Step>('input');
  const [fromToken, setFromToken] = useState<Token>('USDC');
  const [toToken, setToToken] = useState<Token>('cUSD');
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('');
  const [quote, setQuote] = useState<SwapRoute | null>(null);
  const [progress, setProgress] = useState(0);

  const labels = {
    en: {
      title: 'Swap Tokens',
      subtitle: 'Exchange tokens instantly',
      from: 'From',
      to: 'To',
      amount: 'Amount',
      balance: 'Balance',
      rate: 'Exchange Rate',
      fee: 'Fee',
      estimatedTime: 'Estimated Time',
      review: 'Review Swap',
      confirm: 'Confirm Swap',
      processing: 'Processing swap...',
      success: 'Swap Completed!',
      continue: 'Continue',
      insufficientBalance: 'Insufficient balance',
      max: 'Max',
      swap: 'Swap',
    },
    es: {
      title: 'Intercambiar Tokens',
      subtitle: 'Intercambia tokens al instante',
      from: 'De',
      to: 'A',
      amount: 'Cantidad',
      balance: 'Saldo',
      rate: 'Tasa de Cambio',
      fee: 'Tarifa',
      estimatedTime: 'Tiempo Estimado',
      review: 'Revisar Intercambio',
      confirm: 'Confirmar Intercambio',
      processing: 'Procesando intercambio...',
      success: '¡Intercambio Completado!',
      continue: 'Continuar',
      insufficientBalance: 'Saldo insuficiente',
      max: 'Máx',
      swap: 'Intercambiar',
    },
  };

  const t = labels[language];

  const tokenOptions = TOKENS.map(token => ({
    value: token,
    label: token,
  }));

  useEffect(() => {
    if (fromAmount && fromToken && toToken) {
      const rate = EXCHANGE_RATES[fromToken]?.[toToken] || 1;
      const amount = parseFloat(fromAmount);
      if (!isNaN(amount) && amount > 0) {
        const calculated = amount * rate;
        const fee = calculated * 0.001; // 0.1% fee
        setToAmount((calculated - fee).toFixed(6));
      } else {
        setToAmount('');
      }
    } else {
      setToAmount('');
    }
  }, [fromAmount, fromToken, toToken]);

  const handleSwapTokens = () => {
    const temp = fromToken;
    setFromToken(toToken);
    setToToken(temp);
    const tempAmount = fromAmount;
    setFromAmount(toAmount);
    setToAmount(tempAmount);
  };

  const handleMax = () => {
    const balance = walletBalance[fromToken as keyof typeof walletBalance] || 0;
    setFromAmount(balance.toFixed(2));
  };

  const handleContinue = () => {
    const amount = parseFloat(fromAmount);
    const balance = walletBalance[fromToken as keyof typeof walletBalance] || 0;
    
    if (amount > balance) {
      showToast({
        type: 'error',
        message: t.insufficientBalance,
      });
      return;
    }

    if (amount <= 0) {
      return;
    }

    const rate = EXCHANGE_RATES[fromToken]?.[toToken] || 1;
    const calculated = amount * rate;
    const fee = calculated * 0.001;
    const finalAmount = calculated - fee;

    setQuote({
      fromToken,
      toToken,
      fromAmount: amount,
      toAmount: finalAmount,
      rate,
      fee,
      estimatedTime: '~30 seconds',
      route: [fromToken, toToken],
    });

    setStep('review');
  };

  const handleConfirm = async () => {
    if (!quote) return;

    setStep('processing');

    // Simulate swap processing
    for (let i = 0; i <= 100; i += 10) {
      await new Promise(resolve => setTimeout(resolve, 200));
      setProgress(i);
    }

    // Update balances
    const currentFromBalance = walletBalance[quote.fromToken as keyof typeof walletBalance] || 0;
    const currentToBalance = walletBalance[quote.toToken as keyof typeof walletBalance] || 0;

    setWalletBalance({
      ...walletBalance,
      [quote.fromToken]: currentFromBalance - quote.fromAmount,
      [quote.toToken]: currentToBalance + quote.toAmount,
    });

    // Add transaction
    const transaction: Transaction = {
      id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'swap',
      status: 'completed',
      fromToken: quote.fromToken,
      toToken: quote.toToken,
      fromAmount: quote.fromAmount,
      toAmount: quote.toAmount,
      timestamp: Date.now(),
      fee: quote.fee,
      hash: `0x${Math.random().toString(16).substr(2, 64)}`,
    };

    addTransaction(transaction);

    showToast({
      type: 'success',
      message: t.success,
    });

    setStep('success');
  };

  const handleContinueAfterSuccess = () => {
    router.push('/');
  };

  const fromBalance = walletBalance[fromToken as keyof typeof walletBalance] || 0;

  return (
    <Container>
      <div className="py-8">
        <BackButton />
        
        <Card padding="lg" className="max-w-md mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{t.title}</h1>
          <p className="text-gray-600 dark:text-gray-300 mb-6">{t.subtitle}</p>

          {step === 'input' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t.from}</label>
                <Select
                  options={tokenOptions.filter(opt => opt.value !== toToken)}
                  value={fromToken}
                  onChange={(value) => setFromToken(value as Token)}
                />
                <div className="mt-2 flex items-center justify-between">
                  <Input
                    type="number"
                    value={fromAmount}
                    onChange={(e) => setFromAmount(e.target.value)}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    trailingIcon={
                      <button
                        onClick={handleMax}
                        className="text-xs font-medium text-acid-lemon hover:text-acid-lemon-dark"
                      >
                        {t.max}
                      </button>
                    }
                  />
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                  {t.balance}: {fromBalance.toFixed(2)} {fromToken}
                </p>
              </div>

              <div className="flex justify-center -my-2">
                <button
                  onClick={handleSwapTokens}
                  className="p-2 bg-acid-lemon rounded-full hover:bg-acid-lemon-light transition-colors"
                  aria-label="Swap tokens"
                >
                  <Icon color="gray" size="md">
                    <SwapIcon />
                  </Icon>
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t.to}</label>
                <Select
                  options={tokenOptions.filter(opt => opt.value !== fromToken)}
                  value={toToken}
                  onChange={(value) => setToToken(value as Token)}
                />
                <div className="mt-2">
                  <Input
                    type="text"
                    value={toAmount}
                    readOnly
                    placeholder="0.00"
                    className="bg-gray-50"
                  />
                </div>
                {fromAmount && toAmount && (
                  <div className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                    <p>
                      {t.rate}: 1 {fromToken} = {(EXCHANGE_RATES[fromToken]?.[toToken] || 1).toFixed(6)} {toToken}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {t.fee}: {(parseFloat(toAmount) * 0.001 / (EXCHANGE_RATES[fromToken]?.[toToken] || 1)).toFixed(6)} {fromToken}
                    </p>
                  </div>
                )}
              </div>

              <Button
                variant="primary"
                size="lg"
                fullWidth
                onClick={handleContinue}
                disabled={!fromAmount || parseFloat(fromAmount) <= 0 || parseFloat(fromAmount) > fromBalance}
              >
                {t.continue}
              </Button>
            </div>
          )}

          {step === 'review' && quote && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t.review}</h2>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-300">{t.from}</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {quote.fromAmount.toFixed(2)} {quote.fromToken}
                  </span>
                </div>
                <div className="flex justify-center">
                  <Icon color="neon" size="md">
                    <ArrowDownIcon />
                  </Icon>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-300">{t.to}</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {quote.toAmount.toFixed(6)} {quote.toToken}
                  </span>
                </div>
                <div className="border-t-2 border-acid-lemon/30 pt-3 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-300">{t.rate}</span>
                    <span className="text-gray-900 dark:text-white">
                      1 {quote.fromToken} = {quote.rate.toFixed(6)} {quote.toToken}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-300">{t.fee}</span>
                    <span className="text-gray-900 dark:text-white">
                      {quote.fee.toFixed(6)} {quote.toToken}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">{t.estimatedTime}</span>
                    <Badge variant="info" size="sm">{quote.estimatedTime}</Badge>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  size="lg"
                  fullWidth
                  onClick={() => setStep('input')}
                >
                  Back
                </Button>
                <Button
                  variant="primary"
                  size="lg"
                  fullWidth
                  onClick={handleConfirm}
                >
                  {t.confirm}
                </Button>
              </div>
            </div>
          )}

          {step === 'processing' && (
            <div className="space-y-4 text-center">
              <Progress value={progress} />
              <p className="text-gray-600 dark:text-gray-300">{t.processing}</p>
            </div>
          )}

          {step === 'success' && (
            <div className="space-y-4 text-center">
              <Icon size="xl" color="success" className="mx-auto">
                <SwapIcon />
              </Icon>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">{t.success}</p>
              {quote && (
                <div className="text-sm text-gray-600 dark:text-gray-300">
                  <p>
                    Swapped {quote.fromAmount.toFixed(2)} {quote.fromToken} for {quote.toAmount.toFixed(6)} {quote.toToken}
                  </p>
                </div>
              )}
              <Button
                variant="primary"
                size="lg"
                fullWidth
                onClick={handleContinueAfterSuccess}
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

