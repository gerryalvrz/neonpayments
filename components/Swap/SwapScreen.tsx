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
import { TEXTILE_FX_SWAP_URL } from '@/config/ripio';
import {
  isBelowTextileRfqMinimum,
  isTextileQuoteTooCloseToExpiry,
  resolveTextilePair,
  rfqNoQuoteMessage,
  TEXTILE_TOKEN_ADDRESSES,
  toAtomicAmount,
  type TextileUnsignedTx,
} from '@/utils/textile/fx';
import { ensureTextileAllowance, sendTextileTx } from '@/utils/textile/execute';
import type { SwapRoute, Transaction } from '@/types';

type Step = 'input' | 'review' | 'processing' | 'success';

const TOKENS = ['USDT', 'wARS', 'wBRL', 'cUSD', 'USDC'] as const;
type Token = (typeof TOKENS)[number];

const MOCK_RATES: Record<string, Record<string, number>> = {
  cUSD: { USDC: 1.0, USDT: 1.0 },
  USDC: { cUSD: 1.0, USDT: 1.0 },
  USDT: { cUSD: 1.0, USDC: 1.0 },
};

type QuotePreview = {
  live: boolean;
  buyAmount: string;
  hint?: string;
  reason?: string;
};

type SwapBuildResponse = {
  fillable?: boolean;
  id?: string;
  claimToken?: string;
  expiresAt?: string;
  buyAmount?: string | null;
  hint?: string;
  reason?: string;
  error?: string;
  transactions?: { swap?: TextileUnsignedTx };
};

export function SwapScreen() {
  const router = useRouter();
  const { walletBalance, setWalletBalance, addTransaction, language, wallet } = useApp();
  const { showToast } = useToast();
  const [step, setStep] = useState<Step>('input');
  const [fromToken, setFromToken] = useState<Token>('USDT');
  const [toToken, setToToken] = useState<Token>('wBRL');
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('');
  const [quote, setQuote] = useState<SwapRoute | null>(null);
  const [preview, setPreview] = useState<QuotePreview | null>(null);
  const [quoting, setQuoting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [executingLabel, setExecutingLabel] = useState('');
  const [txHash, setTxHash] = useState<string | null>(null);

  const labels = {
    en: {
      title: 'Swap Tokens',
      subtitle: 'wARS / wBRL ↔ USDT via Textile FX. Other pairs stay indicative.',
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
      venue: 'Textile FX RFQ',
      minSize: 'Minimum is 1 whole sell token.',
      connectWallet: 'Connect a wallet to swap on Celo.',
      external: 'Open Textile in another wallet',
    },
    es: {
      title: 'Intercambiar Tokens',
      subtitle: 'wARS / wBRL ↔ USDT vía Textile FX. Otros pares siguen indicativos.',
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
      venue: 'Textile FX RFQ',
      minSize: 'El mínimo es 1 token entero de venta.',
      connectWallet: 'Conecta una billetera para intercambiar en Celo.',
      external: 'Abrir Textile en otra billetera',
    },
  };

  const t = labels[language];
  const textilePair = resolveTextilePair(fromToken, toToken);

  const tokenOptions = TOKENS.map((token) => ({
    value: token,
    label: token,
  }));

  useEffect(() => {
    if (!textilePair) {
      if (isTextileWfiatSide(fromToken) && toToken !== 'USDT') setToToken('USDT');
      else if (isTextileWfiatSide(toToken) && fromToken !== 'USDT') setFromToken('USDT');
    }
  }, [fromToken, toToken, textilePair]);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setPreview(null);
      if (!fromAmount || Number(fromAmount) <= 0) {
        setToAmount('');
        return;
      }

      const pair = resolveTextilePair(fromToken, toToken);
      if (!pair) {
        const rate = MOCK_RATES[fromToken]?.[toToken];
        if (!rate) {
          setToAmount('');
          return;
        }
        const amount = parseFloat(fromAmount);
        const fee = amount * rate * 0.001;
        setToAmount((amount * rate - fee).toFixed(6));
        return;
      }

      if (isBelowTextileRfqMinimum(fromAmount)) {
        setToAmount('');
        setPreview({
          live: false,
          buyAmount: '',
          hint: t.minSize,
        });
        return;
      }

      setQuoting(true);
      try {
        const response = await fetch('/api/textile/quote', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sellSymbol: fromToken,
            buySymbol: toToken,
            sellAmount: fromAmount,
            address: wallet.address || undefined,
          }),
        });
        const data = await response.json();
        if (cancelled) return;
        if (!response.ok) {
          setToAmount('');
          setPreview({ live: false, buyAmount: '', hint: data.error || t.minSize });
          return;
        }
        if (data.status === 'no_quote' || !data.buyAmount) {
          setToAmount('');
          setPreview({
            live: false,
            buyAmount: '',
            reason: data.reason,
            hint: data.hint || rfqNoQuoteMessage(data.reason, language),
          });
          return;
        }
        setToAmount(String(data.buyAmount));
        setPreview({ live: true, buyAmount: String(data.buyAmount), hint: data.hint });
      } catch {
        if (!cancelled) {
          setToAmount('');
          setPreview({ live: false, buyAmount: '', hint: language === 'es' ? 'No se pudo cotizar' : 'Could not quote' });
        }
      } finally {
        if (!cancelled) setQuoting(false);
      }
    };

    const timer = setTimeout(run, 400);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [fromAmount, fromToken, toToken, wallet.address, language, t.minSize]);

  const handleSwapTokens = () => {
    const temp = fromToken;
    setFromToken(toToken);
    setToToken(temp);
    const tempAmount = fromAmount;
    setFromAmount(toAmount);
    setToAmount(tempAmount);
  };

  const handleMax = () => {
    const balance = walletBalance[fromToken] || 0;
    setFromAmount(balance.toFixed(fromToken === 'USDT' || fromToken === 'USDC' ? 2 : 2));
  };

  const handleContinue = () => {
    const amount = parseFloat(fromAmount);
    const balance = walletBalance[fromToken] || 0;

    if (!wallet.address) {
      showToast({ type: 'error', message: t.connectWallet });
      return;
    }

    if (amount > balance) {
      showToast({ type: 'error', message: t.insufficientBalance });
      return;
    }

    if (amount <= 0) return;

    const pair = resolveTextilePair(fromToken, toToken);
    if (pair) {
      if (isBelowTextileRfqMinimum(fromAmount) || !preview?.live || !toAmount) {
        showToast({
          type: 'error',
          message: preview?.hint || t.minSize,
        });
        return;
      }
      const rate = amount > 0 ? parseFloat(toAmount) / amount : 0;
      setQuote({
        fromToken,
        toToken,
        fromAmount: amount,
        toAmount: parseFloat(toAmount),
        rate,
        fee: 0,
        estimatedTime: '~30 seconds',
        route: ['Textile FX', fromToken, toToken],
      });
      setStep('review');
      return;
    }

    const rate = MOCK_RATES[fromToken]?.[toToken] || 1;
    const calculated = amount * rate;
    const fee = calculated * 0.001;
    setQuote({
      fromToken,
      toToken,
      fromAmount: amount,
      toAmount: calculated - fee,
      rate,
      fee,
      estimatedTime: '~30 seconds',
      route: [fromToken, toToken],
    });
    setStep('review');
  };

  const handleConfirm = async () => {
    if (!quote) return;
    const pair = resolveTextilePair(quote.fromToken, quote.toToken);

    if (!pair) {
      setStep('processing');
      for (let i = 0; i <= 100; i += 10) {
        await new Promise((resolve) => setTimeout(resolve, 200));
        setProgress(i);
      }
      const currentFromBalance = walletBalance[quote.fromToken] || 0;
      const currentToBalance = walletBalance[quote.toToken] || 0;
      setWalletBalance({
        ...walletBalance,
        [quote.fromToken]: currentFromBalance - quote.fromAmount,
        [quote.toToken]: currentToBalance + quote.toAmount,
      });
      addTransaction(mockTx(quote));
      showToast({ type: 'success', message: t.success });
      setStep('success');
      return;
    }

    if (!wallet.address) {
      showToast({ type: 'error', message: t.connectWallet });
      return;
    }

    setStep('processing');
    setProgress(15);
    setExecutingLabel(language === 'es' ? 'Revisando aprobación…' : 'Checking approval…');
    try {
      const required = BigInt(toAtomicAmount(fromAmount, pair.sellSymbol));
      await ensureTextileAllowance({
        owner: wallet.address,
        token: TEXTILE_TOKEN_ADDRESSES[pair.sellSymbol],
        required,
        signTransaction: wallet.signTransaction,
      });

      const requestSwap = async () => {
        const response = await fetch('/api/textile/swap', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sellSymbol: pair.sellSymbol,
            buySymbol: pair.buySymbol,
            sellAmount: fromAmount,
            taker: wallet.address,
          }),
        });
        const built = (await response.json()) as SwapBuildResponse;
        if (!response.ok) {
          throw new Error(built.error || built.hint || 'Could not build swap');
        }
        if (!built.fillable || !built.transactions?.swap) {
          throw new Error(built.hint || built.reason || rfqNoQuoteMessage(built.reason, language));
        }
        return built;
      };

      setProgress(40);
      setExecutingLabel(language === 'es' ? 'Pidiendo cotización firme…' : 'Requesting firm quote…');
      let built = await requestSwap();
      if (isTextileQuoteTooCloseToExpiry(built.expiresAt)) {
        built = await requestSwap();
      }
      if (
        isTextileQuoteTooCloseToExpiry(built.expiresAt) ||
        (built.expiresAt && Date.parse(built.expiresAt) <= Date.now())
      ) {
        throw new Error(
          language === 'es'
            ? 'La cotización firme quedó demasiado justa (~30 s). Confirma de nuevo.'
            : 'Firm quote was too close to expiry (~30s). Confirm again.'
        );
      }

      setProgress(70);
      setExecutingLabel(language === 'es' ? 'Firmando el swap…' : 'Signing swap…');
      const hash = await sendTextileTx(built.transactions!.swap!, wallet.signTransaction);

      if (built.id && built.claimToken) {
        await fetch('/api/textile/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: built.id,
            claimToken: built.claimToken,
            txHash: hash,
          }),
        });
      }

      setProgress(100);
      setTxHash(hash);
      addTransaction({
        id: `tx_${Date.now()}`,
        type: 'swap',
        status: 'completed',
        fromToken: quote.fromToken,
        toToken: quote.toToken,
        fromAmount: quote.fromAmount,
        toAmount: built.buyAmount ? Number(built.buyAmount) : quote.toAmount,
        timestamp: Date.now(),
        fee: 0,
        hash,
      });
      showToast({ type: 'success', message: t.success });
      setStep('success');
    } catch (err) {
      showToast({
        type: 'error',
        message: err instanceof Error ? err.message : 'Swap failed',
      });
      setStep('review');
    }
  };

  const fromBalance = walletBalance[fromToken] || 0;
  const continueDisabled =
    !fromAmount ||
    parseFloat(fromAmount) <= 0 ||
    parseFloat(fromAmount) > fromBalance ||
    quoting ||
    (Boolean(resolveTextilePair(fromToken, toToken)) && !preview?.live);

  return (
    <Container>
      <div className="py-8">
        <BackButton />

        <Card padding="lg" className="max-w-md mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{t.title}</h1>
          <p className="text-gray-600 dark:text-gray-300 mb-6">{t.subtitle}</p>

          {step === 'input' && (
            <div className="space-y-4">
              {textilePair && (
                <Badge variant="info" size="sm">{t.venue}</Badge>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t.from}</label>
                <Select
                  options={tokenOptions.filter((opt) => opt.value !== toToken)}
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
                  options={tokenOptions.filter((opt) => opt.value !== fromToken)}
                  value={toToken}
                  onChange={(value) => setToToken(value as Token)}
                />
                <div className="mt-2">
                  <Input
                    type="text"
                    value={quoting ? '…' : toAmount}
                    readOnly
                    placeholder="0.00"
                    className="bg-gray-50"
                  />
                </div>
                {preview?.hint && (
                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">{preview.hint}</p>
                )}
              </div>

              <Button
                variant="primary"
                size="lg"
                fullWidth
                onClick={handleContinue}
                disabled={continueDisabled}
              >
                {t.continue}
              </Button>
              {textilePair && (
                <Button
                  variant="secondary"
                  size="sm"
                  fullWidth
                  onClick={() => window.open(TEXTILE_FX_SWAP_URL, '_blank', 'noopener,noreferrer')}
                >
                  {t.external}
                </Button>
              )}
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
                    <span className="text-gray-600">{t.estimatedTime}</span>
                    <Badge variant="info" size="sm">{quote.estimatedTime}</Badge>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="secondary" size="lg" fullWidth onClick={() => setStep('input')}>
                  Back
                </Button>
                <Button variant="primary" size="lg" fullWidth onClick={handleConfirm}>
                  {t.confirm}
                </Button>
              </div>
            </div>
          )}

          {step === 'processing' && (
            <div className="space-y-4 text-center">
              <Progress value={progress} />
              <p className="text-gray-600 dark:text-gray-300">{executingLabel || t.processing}</p>
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
                  {txHash && (
                    <a
                      className="mt-2 inline-block text-xs underline"
                      href={`https://celoscan.io/tx/${txHash}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {txHash.slice(0, 10)}…
                    </a>
                  )}
                </div>
              )}
              <Button variant="primary" size="lg" fullWidth onClick={() => router.push('/')}>
                {t.continue}
              </Button>
            </div>
          )}
        </Card>
      </div>
    </Container>
  );
}

function isTextileWfiatSide(symbol: string) {
  return symbol === 'wARS' || symbol === 'wBRL';
}

function mockTx(quote: SwapRoute): Transaction {
  return {
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
}
