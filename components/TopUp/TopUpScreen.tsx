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
import { Progress } from '@/components/UI/Loading';
import { Badge } from '@/components/UI/Badge';
import { Tabs } from '@/components/UI/Tabs';
import { 
  mockGetTransakQuote, 
  mockInitiateTransakPurchase, 
  mockCompleteTransakPurchase,
  type TransakQuote 
} from '@/utils/mockApi';

type PaymentMethod = 'mercado' | 'transak';
type Step = 'input' | 'review' | 'processing' | 'success';

export function TopUpScreen() {
  const router = useRouter();
  const { user, mercadoPago, walletBalance, setWalletBalance, addTransaction, language } = useApp();
  const { showToast } = useToast();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('mercado');
  const [step, setStep] = useState<Step>('input');
  const [amount, setAmount] = useState('');
  const [progress, setProgress] = useState(0);
  const [quote, setQuote] = useState<{ from: number; to: number } | null>(null);
  const [transakQuote, setTransakQuote] = useState<TransakQuote | null>(null);
  const [transakPurchaseId, setTransakPurchaseId] = useState<string | null>(null);

  const labels = {
    en: {
      title: 'Add Funds',
      subtitle: 'Convert MXN to USDC',
      mercadoTab: 'Mercado Pago',
      transakTab: 'Buy with Card',
      amount: 'Amount (MXN)',
      review: 'Review Transaction',
      from: 'From',
      to: 'To',
      rate: 'Rate',
      fee: 'Fee',
      total: 'Total',
      processing: 'Processing...',
      success: 'Funds Added Successfully!',
      continue: 'Continue',
      confirm: 'Confirm',
      buyNow: 'Buy Now',
      transakDescription: 'Buy USDC directly with your credit or debit card',
      mercadoDescription: 'Convert MXN from your Mercado Pago account',
    },
    es: {
      title: 'Agregar Fondos',
      subtitle: 'Convertir MXN a USDC',
      mercadoTab: 'Mercado Pago',
      transakTab: 'Comprar con Tarjeta',
      amount: 'Cantidad (MXN)',
      review: 'Revisar Transacción',
      from: 'De',
      to: 'A',
      rate: 'Tasa',
      fee: 'Comisión',
      total: 'Total',
      processing: 'Procesando...',
      success: '¡Fondos Agregados Exitosamente!',
      continue: 'Continuar',
      confirm: 'Confirmar',
      buyNow: 'Comprar Ahora',
      transakDescription: 'Compra USDC directamente con tu tarjeta de crédito o débito',
      mercadoDescription: 'Convierte MXN desde tu cuenta de Mercado Pago',
    },
  };

  const t = labels[language];

  const handleAmountSubmit = async () => {
    const numAmount = parseFloat(amount);
    if (numAmount <= 0) return;

    if (paymentMethod === 'mercado') {
      if (numAmount > 0 && mercadoPago.connected && numAmount <= mercadoPago.balance) {
        // Mock Squid Router quote (1 MXN ≈ 0.055 USDC)
        const usdcAmount = numAmount * 0.055;
        setQuote({ from: numAmount, to: usdcAmount });
        setStep('review');
      } else if (!mercadoPago.connected) {
        showToast({
          type: 'error',
          message: language === 'es' 
            ? 'Por favor conecta tu cuenta de Mercado Pago primero'
            : 'Please connect your Mercado Pago account first',
        });
      } else if (numAmount > mercadoPago.balance) {
        showToast({
          type: 'error',
          message: language === 'es'
            ? 'Fondos insuficientes en Mercado Pago'
            : 'Insufficient funds in Mercado Pago',
        });
      }
    } else if (paymentMethod === 'transak') {
      try {
        // Get Transak quote
        const quote = await mockGetTransakQuote(numAmount, 'MXN', 'USDC');
        setTransakQuote(quote);
        setStep('review');
      } catch (error) {
        showToast({
          type: 'error',
          message: language === 'es'
            ? 'Error al obtener cotización'
            : 'Error getting quote',
        });
      }
    }
  };

  const handleConfirm = async () => {
    setStep('processing');
    
    if (paymentMethod === 'mercado' && quote) {
      // Simulate Mercado Pago transaction
      for (let i = 0; i <= 100; i += 10) {
        await new Promise(resolve => setTimeout(resolve, 200));
        setProgress(i);
      }

      // Update wallet balance
      setWalletBalance({
        ...walletBalance,
        USDC: walletBalance.USDC + quote.to,
      });

      // Add transaction to history
      const transaction = {
        id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'topup' as const,
        status: 'completed' as const,
        fromToken: 'MXN',
        toToken: 'USDC',
        fromAmount: quote.from,
        toAmount: quote.to,
        timestamp: Date.now(),
        fee: quote.from * 0.001,
        hash: `0x${Math.random().toString(16).substr(2, 64)}`,
      };
      addTransaction(transaction);

      showToast({
        type: 'success',
        message: t.success,
      });

      setStep('success');
    } else if (paymentMethod === 'transak' && transakQuote && user?.walletAddress) {
      // Simulate Transak purchase flow
      setProgress(20);
      
      // Initiate purchase
      const purchase = await mockInitiateTransakPurchase(transakQuote, user.walletAddress);
      setTransakPurchaseId(purchase.id);
      setProgress(50);

      // Simulate payment processing
      for (let i = 50; i <= 90; i += 10) {
        await new Promise(resolve => setTimeout(resolve, 300));
        setProgress(i);
      }

      // Complete purchase
      const transaction = await mockCompleteTransakPurchase(purchase.id);
      
      // Update transaction with actual amounts
      const completedTransaction = {
        ...transaction,
        fromAmount: transakQuote.fiatAmount,
        toAmount: transakQuote.cryptoAmount,
        fee: transakQuote.fee,
      };

      setProgress(100);

      // Update wallet balance
      setWalletBalance({
        ...walletBalance,
        USDC: walletBalance.USDC + transakQuote.cryptoAmount,
      });

      // Add transaction to history
      addTransaction(completedTransaction);

      showToast({
        type: 'success',
        message: t.success,
      });

      setStep('success');
    }
  };

  const handleContinue = () => {
    router.push('/');
  };

  const handleMethodChange = (method: string) => {
    setPaymentMethod(method as PaymentMethod);
    setStep('input');
    setAmount('');
    setQuote(null);
    setTransakQuote(null);
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

          {/* Payment Method Tabs */}
          <div className="mb-6">
            <Tabs
              tabs={[
                { id: 'mercado', label: t.mercadoTab },
                { id: 'transak', label: t.transakTab },
              ]}
              activeTab={paymentMethod}
              onChange={handleMethodChange}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              {paymentMethod === 'mercado' ? t.mercadoDescription : t.transakDescription}
            </p>
          </div>

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
              {paymentMethod === 'mercado' && mercadoPago.connected && (
                <p className="text-sm font-medium text-gray-500">
                  Available: <span className="font-bold text-gray-900 dark:text-white financial-number">${mercadoPago.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span> MXN
                </p>
              )}
              {paymentMethod === 'mercado' && !mercadoPago.connected && (
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
                onClick={handleAmountSubmit}
                disabled={
                  !amount || 
                  parseFloat(amount) <= 0 || 
                  (paymentMethod === 'mercado' && !mercadoPago.connected)
                }
              >
                {paymentMethod === 'transak' ? t.buyNow : t.continue}
              </Button>
            </div>
          )}

          {step === 'review' && (
            <div className="space-y-6">
              {paymentMethod === 'mercado' && quote && (
                <div className="space-y-4 p-5 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
                  <div className="flex justify-between items-center pb-3 border-b border-gray-200 dark:border-gray-700">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-300">{t.from}</span>
                    <span className="font-bold text-lg text-gray-900 dark:text-white financial-number">{quote.from.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-sm font-semibold text-gray-600 dark:text-gray-300">MXN</span></span>
                  </div>
                  <div className="flex justify-between items-center pb-3 border-b border-gray-200 dark:border-gray-700">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-300">{t.to}</span>
                    <span className="font-bold text-lg text-gray-900 dark:text-white financial-number">{quote.to.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-sm font-semibold text-gray-600 dark:text-gray-300">USDC</span></span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-300">{t.rate}</span>
                    <Badge variant="neon">1 MXN ≈ 0.055 USDC</Badge>
                  </div>
                </div>
              )}
              
              {paymentMethod === 'transak' && transakQuote && (
                <div className="space-y-4 p-5 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
                  <div className="flex justify-between items-center pb-3 border-b border-gray-200 dark:border-gray-700">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-300">{t.from}</span>
                    <span className="font-bold text-lg text-gray-900 dark:text-white financial-number">{transakQuote.fiatAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-sm font-semibold text-gray-600 dark:text-gray-300">{transakQuote.fiatCurrency}</span></span>
                  </div>
                  <div className="flex justify-between items-center pb-3 border-b border-gray-200 dark:border-gray-700">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-300">{t.to}</span>
                    <span className="font-bold text-lg text-gray-900 dark:text-white financial-number">{transakQuote.cryptoAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-sm font-semibold text-gray-600 dark:text-gray-300">{transakQuote.cryptoCurrency}</span></span>
                  </div>
                  <div className="flex justify-between items-center pb-3 border-b border-gray-200 dark:border-gray-700">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-300">{t.fee}</span>
                    <span className="text-sm font-semibold text-gray-600 dark:text-gray-300">{transakQuote.fee.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {transakQuote.cryptoCurrency}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-300">{t.rate}</span>
                    <Badge variant="neon">1 {transakQuote.fiatCurrency} ≈ {transakQuote.exchangeRate.toFixed(4)} {transakQuote.cryptoCurrency}</Badge>
                  </div>
                </div>
              )}
              
              <Button
                variant="primary"
                size="lg"
                fullWidth
                onClick={handleConfirm}
              >
                {paymentMethod === 'transak' ? t.buyNow : t.confirm}
              </Button>
            </div>
          )}

          {step === 'processing' && (
            <div className="space-y-4">
              <Progress value={progress} />
              <p className="text-center text-gray-600 dark:text-gray-300">{t.processing}</p>
            </div>
          )}

          {step === 'success' && (
            <div className="space-y-4 text-center">
              <p className="text-lg font-semibold text-gray-900 dark:text-white">{t.success}</p>
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
