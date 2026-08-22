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
  textileCounterpart,
  TEXTILE_CELO_CHAIN_ID,
  TEXTILE_TOKEN_ADDRESSES,
  toAtomicAmount,
  type TextileUnsignedTx,
} from '@/utils/textile/fx';
import { ensureTextileAllowance, sendTextileTx } from '@/utils/textile/execute';
import { createSwapIntent, updateSwapIntent } from '@/utils/intent-logging';
import { friendlyError } from '@/utils/errors';
import { recoverBroadcastTxHash } from '@/utils/wallet/recoverTxHash';
import { celoscanTxUrl } from '@/utils/explorer';
import type { SwapRoute } from '@/types';

type Step = 'input' | 'review' | 'processing' | 'success';

const TOKENS = ['USDT', 'wBRL', 'wARS'] as const;
type Token = (typeof TOKENS)[number];

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
  const { walletBalance, language, wallet } = useApp();
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
  const [submitWarning, setSubmitWarning] = useState<string | null>(null);

  const labels = {
    en: {
      title: 'Swap Tokens',
      subtitle: 'wARS / wBRL ↔ USDT on Celo. Other pairs are not available yet.',
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
      pairUnavailable: 'This pair is not available yet.',
    },
    es: {
      title: 'Intercambiar Tokens',
      subtitle: 'wARS / wBRL ↔ USDT en Celo. Otros pares aún no están disponibles.',
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
      pairUnavailable: 'Este par aún no está disponible.',
    },
  };

  const t = labels[language];
  const textilePair = resolveTextilePair(fromToken, toToken);

  const tokenOptions = TOKENS.map((token) => ({
    value: token,
    label: token,
  }));

  const selectFromToken = (next: Token) => {
    setFromToken(next);
    if (next === toToken || !resolveTextilePair(next, toToken)) {
      setToToken(textileCounterpart(next, toToken));
    }
  };

  const selectToToken = (next: Token) => {
    setToToken(next);
    if (next === fromToken || !resolveTextilePair(fromToken, next)) {
      setFromToken(textileCounterpart(next, fromToken));
    }
  };

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
        setToAmount('');
        setPreview({
          live: false,
          buyAmount: '',
          hint: t.pairUnavailable,
        });
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
        let data: {
          status?: string
          buyAmount?: string
          hint?: string
          reason?: string
          error?: string
        } = {}
        let ok = false
        for (let attempt = 0; attempt < 3; attempt += 1) {
          const response = await fetch('/api/textile/quote', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sellSymbol: fromToken,
              buySymbol: toToken,
              sellAmount: fromAmount,
              address: wallet.address || undefined,
              language,
            }),
          });
          data = await response.json();
          ok = response.ok;
          if (cancelled) return;
          if (ok && data.status !== 'no_quote' && data.buyAmount) break;
          if (attempt < 2) {
            await new Promise((resolve) => setTimeout(resolve, 1500));
          }
        }
        if (cancelled) return;
        if (!ok) {
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
            hint: data.hint || rfqNoQuoteMessage(data.reason, language, pair.wfiat),
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
    setFromAmount(balance.toFixed(2));
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
    if (!pair) {
      showToast({ type: 'error', message: t.pairUnavailable });
      return;
    }

    if (isBelowTextileRfqMinimum(fromAmount)) {
      showToast({
        type: 'error',
        message: preview?.hint || t.minSize,
      });
      return;
    }
    const estimatedOut = parseFloat(toAmount) || 0;
    setQuote({
      fromToken,
      toToken,
      fromAmount: amount,
      toAmount: estimatedOut,
      rate: amount > 0 && estimatedOut > 0 ? estimatedOut / amount : 0,
      fee: 0,
      estimatedTime: '~30 seconds',
      route: ['Textile FX', fromToken, toToken],
    });
    setStep('review');
  };

  const handleConfirm = async () => {
    if (!quote) return;
    const pair = resolveTextilePair(quote.fromToken, quote.toToken);
    if (!pair) {
      showToast({ type: 'error', message: t.pairUnavailable });
      return;
    }
    if (!wallet.address) {
      showToast({ type: 'error', message: t.connectWallet });
      return;
    }

    const intentId = crypto.randomUUID();
    const txHashes: string[] = [];
    let signed = false;
    setSubmitWarning(null);
    setStep('processing');
    setProgress(10);
    setExecutingLabel(language === 'es' ? 'Registrando…' : 'Saving intent…');

    try {
      const sellAmount = toAtomicAmount(fromAmount, pair.sellSymbol);
      await createSwapIntent({
        intentId,
        userAddress: wallet.address,
        chainId: TEXTILE_CELO_CHAIN_ID,
        sellToken: pair.sellSymbol,
        buyToken: pair.buySymbol,
        sellAmount,
        venue: 'textile',
      });

      setProgress(20);
      setExecutingLabel(language === 'es' ? 'Revisando aprobación…' : 'Checking approval…');
      const approvalTxHash = await ensureTextileAllowance({
        owner: wallet.address,
        token: TEXTILE_TOKEN_ADDRESSES[pair.sellSymbol],
        required: BigInt(sellAmount),
        signTransaction: wallet.signTransaction,
      });
      if (approvalTxHash) {
        await updateSwapIntent(intentId, { approvalTxHash });
      }

      const requestSwap = async () => {
        const response = await fetch('/api/textile/swap', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sellSymbol: pair.sellSymbol,
            buySymbol: pair.buySymbol,
            sellAmount: fromAmount,
            taker: wallet.address,
            language,
          }),
        });
        const built = (await response.json()) as SwapBuildResponse;
        if (!response.ok) {
          throw new Error(built.error || built.hint || 'Could not build swap');
        }
        return built;
      };

      setProgress(40);
      setExecutingLabel(language === 'es' ? 'Pidiendo cotización firme…' : 'Requesting firm quote…');
      let built: SwapBuildResponse | null = null;
      for (let attempt = 0; attempt < 3; attempt += 1) {
        built = await requestSwap();
        if (built.fillable && built.transactions?.swap) break;
        if (attempt < 2) {
          setExecutingLabel(
            language === 'es' ? 'Esperando un market maker…' : 'Waiting for a maker…'
          );
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }
      }
      if (!built?.fillable || !built.transactions?.swap) {
        throw new Error(
          built?.hint || built?.reason || rfqNoQuoteMessage(built?.reason, language, pair.wfiat)
        );
      }
      if (isTextileQuoteTooCloseToExpiry(built.expiresAt)) {
        built = await requestSwap();
      }
      if (!built.fillable || !built.transactions?.swap) {
        throw new Error(
          built.hint || built.reason || rfqNoQuoteMessage(built.reason, language, pair.wfiat)
        );
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

      const quotedAtomic = built.buyAmount
        ? toAtomicAmount(String(built.buyAmount), pair.buySymbol)
        : undefined;
      await updateSwapIntent(intentId, {
        rfqId: built.id,
        claimToken: built.claimToken,
        expiresAt: built.expiresAt ?? null,
        buyAmountQuoted: quotedAtomic,
      });

      const buyToken = TEXTILE_TOKEN_ADDRESSES[pair.buySymbol];
      let buyBefore: bigint | undefined;
      try {
        buyBefore = (await wallet.getTokenBalance(buyToken)).balance;
      } catch {
        buyBefore = undefined;
      }

      setProgress(70);
      setExecutingLabel(language === 'es' ? 'Firmando el swap…' : 'Signing swap…');
      const hash = await sendTextileTx(
        built.transactions!.swap!,
        wallet.signTransaction,
        wallet.address,
        async (submittedHash) => {
          signed = true;
          txHashes.push(submittedHash);
          await updateSwapIntent(intentId, {
            status: 'submitted',
            txHashes: [...txHashes],
          });
        }
      );

      setProgress(85);
      setExecutingLabel(language === 'es' ? 'Reportando el swap…' : 'Reporting swap…');
      let submitOk = false;
      if (built.id && built.claimToken) {
        for (let attempt = 0; attempt < 2; attempt += 1) {
          const submit = await fetch('/api/textile/submit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: built.id,
              claimToken: built.claimToken,
              txHash: hash,
            }),
          });
          if (submit.ok) {
            submitOk = true;
            break;
          }
          if (attempt === 0 && submit.status >= 500) continue;
          break;
        }
      }

      let buyActual = quotedAtomic;
      try {
        const buyAfter = (await wallet.getTokenBalance(buyToken)).balance;
        if (buyBefore !== undefined && buyAfter > buyBefore) {
          buyActual = (buyAfter - buyBefore).toString();
        }
      } catch {
        // keep quoted amount
      }

      if (!submitOk) {
        await updateSwapIntent(intentId, {
          status: 'submitted',
          txHashes,
          submitOk: false,
          buyAmountActual: buyActual,
          error: 'Venue report failed after the transaction was mined',
        });
        setTxHash(hash);
        setSubmitWarning(
          language === 'es'
            ? 'La transacción está en Celo, pero no se pudo reportar al venue. Revisa el historial.'
            : 'The transaction is on Celo, but the venue report failed. Check history.'
        );
        setProgress(100);
        setStep('success');
        return;
      }

      await updateSwapIntent(intentId, {
        status: 'confirmed',
        txHashes,
        submitOk: true,
        buyAmountActual: buyActual,
        error: null,
      });

      setProgress(100);
      setTxHash(hash);
      showToast({ type: 'success', message: t.success });
      setStep('success');
    } catch (err) {
      const recovered = recoverBroadcastTxHash(err);
      if (recovered && !txHashes.includes(recovered)) {
        txHashes.push(recovered);
        signed = true;
      }
      if (intentId) {
        await updateSwapIntent(intentId, {
          status: signed ? 'submitted' : 'failed',
          txHashes: txHashes.length ? txHashes : undefined,
          error: signed ? null : err instanceof Error ? err.message : 'Swap failed',
        }).catch(() => undefined);
      }
      if (signed && txHashes[0]) {
        setTxHash(txHashes[0]);
        setSubmitWarning(
          language === 'es'
            ? 'La transacción se envió. Ábrela en el historial si esta pantalla no confirma.'
            : 'The transaction was sent. Check history if this screen does not confirm.'
        );
        setProgress(100);
        setStep('success');
        return;
      }
      showToast({
        type: 'error',
        message: friendlyError(err, language, 'swap'),
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
    !textilePair ||
    isBelowTextileRfqMinimum(fromAmount);

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
                  options={tokenOptions}
                  value={fromToken}
                  onChange={(value) => selectFromToken(value as Token)}
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
                  options={tokenOptions}
                  value={toToken}
                  onChange={(value) => selectToToken(value as Token)}
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
                  {submitWarning && (
                    <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">{submitWarning}</p>
                  )}
                  {txHash && (
                    <a
                      className="mt-2 inline-block text-xs underline"
                      href={celoscanTxUrl(txHash)}
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
