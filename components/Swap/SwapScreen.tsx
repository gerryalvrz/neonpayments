'use client';

import React, { useEffect, useRef, useState } from 'react';
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
import { groupedPaymentOptions, MENTO_PAYMENT_SYMBOLS } from '@/config/tokens';
import { cn } from '@/utils/cn';
import {
  fromMentoAtomic,
  mentoCounterpart,
  mentoNoQuoteMessage,
  MENTO_CELO_CHAIN_ID,
  mentoTokenAddress,
  resolveMentoPair,
  toMentoAtomic,
  type MentoPair,
  type MentoUnsignedTx,
} from '@/utils/mento/swap';
import {
  isBelowTextileRfqMinimum,
  isTextileQuoteTooCloseToExpiry,
  resolveTextilePair,
  rfqNoQuoteMessage,
  textileComingSoonWfiat,
  textileCounterpart,
  textileLiveRouteLabels,
  TEXTILE_CELO_CHAIN_ID,
  TEXTILE_DEFAULT_WFIAT,
  TEXTILE_SWAP_SYMBOLS,
  TEXTILE_TOKEN_ADDRESSES,
  toAtomicAmount,
  type TextileSwapSymbol,
  type TextileUnsignedTx,
} from '@/utils/textile/fx';
import { ensureTextileAllowance, sendTextileTx, sendUnsignedCeloTx } from '@/utils/textile/execute';
import { createSwapIntent, updateSwapIntent } from '@/utils/intent-logging';
import { friendlyError } from '@/utils/errors';
import { recoverBroadcastTxHash } from '@/utils/wallet/recoverTxHash';
import { celoscanTxUrl } from '@/utils/explorer';
import type { SwapRoute } from '@/types';

type Step = 'input' | 'review' | 'processing' | 'success';
type SwapDesk = 'mento' | 'ripio';

const SWAP_DESK_KEY = 'neonpay:swap-desk';
const MENTO_SWAP_TOKENS = [...MENTO_PAYMENT_SYMBOLS, 'USDC', 'USDT'] as const;
const RIPIO_SWAP_TOKENS = TEXTILE_SWAP_SYMBOLS;
type Token = (typeof MENTO_SWAP_TOKENS)[number] | TextileSwapSymbol;

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

type MentoBuildResponse = {
  fillable?: boolean;
  buyAmount?: string | null;
  buyAtomic?: string;
  hint?: string;
  reason?: string;
  error?: string;
  transactions?: { approval?: MentoUnsignedTx | null; swap?: MentoUnsignedTx };
};

export function SwapScreen() {
  const router = useRouter();
  const { walletBalance, language, wallet } = useApp();
  const { showToast } = useToast();
  const [step, setStep] = useState<Step>('input');
  const [desk, setDesk] = useState<SwapDesk>('mento');
  const [fromToken, setFromToken] = useState<Token>('USDm');
  const [toToken, setToToken] = useState<Token>('USDC');
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('');
  const [quote, setQuote] = useState<SwapRoute | null>(null);
  const [preview, setPreview] = useState<QuotePreview | null>(null);
  const [quoting, setQuoting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [executingLabel, setExecutingLabel] = useState('');
  const [txHash, setTxHash] = useState<string | null>(null);
  const [submitWarning, setSubmitWarning] = useState<string | null>(null);
  const deskHydrated = useRef(false);

  const labels = {
    en: {
      title: 'Swap',
      subtitleMento: 'Mento stables to each other, or into USDC / USDT for cash-out.',
      subtitleRipio: 'Ripio wFIAT through Textile FX. Only live corridors are listed.',
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
      venue: 'Textile FX',
      mentoVenue: 'Mento',
      deskMento: 'Mento',
      deskRipio: 'Ripio',
      deskLabel: 'Swap venue',
      liveRoutes: 'Live now',
      comingSoon: 'When Textile turns them on',
      minSize: 'Minimum is 1 whole sell token.',
      connectWallet: 'Connect a wallet to swap on Celo.',
      external: 'Open Textile in another wallet',
      pairUnavailable: 'This pair is not available yet.',
    },
    es: {
      title: 'Intercambiar',
      subtitleMento: 'Stables de Mento entre sí, o a USDC / USDT para retirar.',
      subtitleRipio: 'wFIAT de Ripio vía Textile FX. Solo se listan los corredores activos.',
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
      venue: 'Textile FX',
      mentoVenue: 'Mento',
      deskMento: 'Mento',
      deskRipio: 'Ripio',
      deskLabel: 'Venue de intercambio',
      liveRoutes: 'Activos ahora',
      comingSoon: 'Cuando Textile los active',
      minSize: 'El mínimo es 1 token entero de venta.',
      connectWallet: 'Conecta una billetera para intercambiar en Celo.',
      external: 'Abrir Textile en otra billetera',
      pairUnavailable: 'Este par aún no está disponible.',
    },
  };

  const t = labels[language];
  const textilePair = desk === 'ripio' ? resolveTextilePair(fromToken, toToken) : null;
  const mentoPair = desk === 'mento' ? resolveMentoPair(fromToken, toToken) : null;
  const liveVenue = textilePair ? 'textile' : mentoPair ? 'mento' : null;
  const tokenOptions = groupedPaymentOptions(
    language,
    desk === 'mento' ? MENTO_SWAP_TOKENS : RIPIO_SWAP_TOKENS
  );
  const liveRoutes = textileLiveRouteLabels();
  const comingSoon = textileComingSoonWfiat();

  const applyDesk = (next: SwapDesk) => {
    setDesk(next);
    setFromAmount('');
    setToAmount('');
    setPreview(null);
    setQuote(null);
    setStep('input');
    if (next === 'mento') {
      setFromToken('USDm');
      setToToken('USDC');
    } else {
      setFromToken('USDT');
      setToToken(TEXTILE_DEFAULT_WFIAT);
    }
    try {
      localStorage.setItem(SWAP_DESK_KEY, next);
    } catch {}
  };

  useEffect(() => {
    if (deskHydrated.current) return;
    deskHydrated.current = true;
    try {
      const saved = localStorage.getItem(SWAP_DESK_KEY);
      if (saved === 'ripio') applyDesk('ripio');
    } catch {}
  }, []);

  const selectFromToken = (next: Token) => {
    setFromToken(next);
    if (desk === 'ripio') {
      if (next === toToken || !resolveTextilePair(next, toToken)) {
        setToToken(textileCounterpart(next as TextileSwapSymbol, toToken));
      }
      return;
    }
    if (next === toToken || !resolveMentoPair(next, toToken)) {
      setToToken(mentoCounterpart(next, toToken) as Token);
    }
  };

  const selectToToken = (next: Token) => {
    setToToken(next);
    if (desk === 'ripio') {
      if (next === fromToken || !resolveTextilePair(fromToken, next)) {
        setFromToken(textileCounterpart(next as TextileSwapSymbol, fromToken));
      }
      return;
    }
    if (next === fromToken || !resolveMentoPair(fromToken, next)) {
      setFromToken(mentoCounterpart(next, fromToken) as Token);
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

      const nextTextile = resolveTextilePair(fromToken, toToken);
      const nextMento = nextTextile ? null : resolveMentoPair(fromToken, toToken);
      if (!nextTextile && !nextMento) {
        setToAmount('');
        setPreview({
          live: false,
          buyAmount: '',
          hint: t.pairUnavailable,
        });
        return;
      }

      if (nextTextile && isBelowTextileRfqMinimum(fromAmount)) {
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
        if (nextMento) {
          const response = await fetch('/api/mento/quote', {
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
          const data = (await response.json()) as {
            status?: string
            buyAmount?: string
            hint?: string
            reason?: string
            error?: string
          };
          if (cancelled) return;
          if (!response.ok) {
            setToAmount('');
            setPreview({ live: false, buyAmount: '', hint: data.error || t.pairUnavailable });
            return;
          }
          if (data.status === 'no_quote' || !data.buyAmount) {
            setToAmount('');
            setPreview({
              live: false,
              buyAmount: '',
              reason: data.reason,
              hint: data.hint || mentoNoQuoteMessage(data.reason, language),
            });
            return;
          }
          setToAmount(String(data.buyAmount));
          setPreview({ live: true, buyAmount: String(data.buyAmount), hint: data.hint });
          return;
        }

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
            hint: data.hint || rfqNoQuoteMessage(data.reason, language, nextTextile!.wfiat),
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
  }, [fromAmount, fromToken, toToken, wallet.address, language, t.minSize, t.pairUnavailable]);

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

    const nextTextile = resolveTextilePair(fromToken, toToken);
    const nextMento = nextTextile ? null : resolveMentoPair(fromToken, toToken);
    if (!nextTextile && !nextMento) {
      showToast({ type: 'error', message: t.pairUnavailable });
      return;
    }

    if (nextTextile && isBelowTextileRfqMinimum(fromAmount)) {
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
      estimatedTime: nextMento ? '~15 seconds' : '~30 seconds',
      route: [nextMento ? 'Mento' : 'Textile FX', fromToken, toToken],
    });
    setStep('review');
  };

  const confirmMentoSwap = async (pair: MentoPair) => {
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
      const sellAmount = toMentoAtomic(fromAmount, pair.sellSymbol);
      await createSwapIntent({
        intentId,
        userAddress: wallet.address,
        chainId: MENTO_CELO_CHAIN_ID,
        sellToken: pair.sellSymbol,
        buyToken: pair.buySymbol,
        sellAmount,
        venue: 'mento',
      });

      setProgress(35);
      setExecutingLabel(language === 'es' ? 'Armando el swap Mento…' : 'Building Mento swap…');
      const response = await fetch('/api/mento/swap', {
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
      const built = (await response.json()) as MentoBuildResponse;
      if (!response.ok) {
        throw new Error(built.error || built.hint || 'Could not build Mento swap');
      }
      if (!built.fillable || !built.transactions?.swap) {
        throw new Error(built.hint || mentoNoQuoteMessage(built.reason, language));
      }

      const quotedAtomic = built.buyAtomic || (built.buyAmount
        ? toMentoAtomic(String(built.buyAmount), pair.buySymbol)
        : undefined);
      await updateSwapIntent(intentId, { buyAmountQuoted: quotedAtomic });

      const buyToken = mentoTokenAddress(pair.buySymbol);
      let buyBefore: bigint | undefined;
      try {
        buyBefore = (await wallet.getTokenBalance(buyToken)).balance;
      } catch {
        buyBefore = undefined;
      }

      if (built.transactions.approval) {
        setProgress(55);
        setExecutingLabel(language === 'es' ? 'Aprobando el token…' : 'Approving token…');
        const approvalTxHash = await sendUnsignedCeloTx(
          built.transactions.approval,
          wallet.signTransaction,
          wallet.address
        );
        await updateSwapIntent(intentId, { approvalTxHash });
      }

      setProgress(75);
      setExecutingLabel(language === 'es' ? 'Firmando el swap…' : 'Signing swap…');
      const hash = await sendUnsignedCeloTx(
        built.transactions.swap,
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

      let buyActual = quotedAtomic;
      try {
        const buyAfter = (await wallet.getTokenBalance(buyToken)).balance;
        if (buyBefore !== undefined && buyAfter > buyBefore) {
          buyActual = (buyAfter - buyBefore).toString();
        }
      } catch {
        // keep quoted amount
      }

      await updateSwapIntent(intentId, {
        status: 'confirmed',
        txHashes,
        submitOk: true,
        buyAmountActual: buyActual,
        error: null,
      });

      if (quotedAtomic) {
        setQuote((current) =>
          current
            ? { ...current, toAmount: Number(fromMentoAtomic(quotedAtomic, pair.buySymbol)) }
            : current
        );
      }

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
      await updateSwapIntent(intentId, {
        status: signed ? 'submitted' : 'failed',
        txHashes: txHashes.length ? txHashes : undefined,
        error: signed ? null : err instanceof Error ? err.message : 'Swap failed',
      }).catch(() => undefined);
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

  const handleConfirm = async () => {
    if (!quote) return;
    if (!wallet.address) {
      showToast({ type: 'error', message: t.connectWallet });
      return;
    }

    const pair = resolveTextilePair(quote.fromToken, quote.toToken);
    const nextMento = pair ? null : resolveMentoPair(quote.fromToken, quote.toToken);
    if (!pair && !nextMento) {
      showToast({ type: 'error', message: t.pairUnavailable });
      return;
    }
    if (nextMento) {
      await confirmMentoSwap(nextMento);
      return;
    }
    if (!pair) return;

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
    !liveVenue ||
    !preview?.live ||
    (textilePair ? isBelowTextileRfqMinimum(fromAmount) : false);

  return (
    <Container>
      <div className="py-8">
        <BackButton />

        <Card padding="lg" className="max-w-md mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{t.title}</h1>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            {desk === 'mento' ? t.subtitleMento : t.subtitleRipio}
          </p>

          {step === 'input' && (
            <div className="space-y-4">
              <div
                className="inline-flex w-full rounded-full border border-gray-200/70 dark:border-gray-700/70 bg-white/60 dark:bg-gray-900/40 p-1"
                role="tablist"
                aria-label={t.deskLabel}
              >
                {([
                  { id: 'mento' as const, label: t.deskMento },
                  { id: 'ripio' as const, label: t.deskRipio },
                ]).map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={desk === tab.id}
                    onClick={() => applyDesk(tab.id)}
                    className={cn(
                      'flex-1 px-3.5 py-1.5 text-base font-display tracking-wide rounded-full transition-all',
                      desk === tab.id
                        ? 'bg-acid-lemon text-gray-900 shadow-acid'
                        : 'text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white'
                    )}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
              <Badge variant="info" size="sm">
                {desk === 'mento' ? t.mentoVenue : t.venue}
              </Badge>
              {desk === 'ripio' && (
                <div className="rounded-xl border border-gray-200/70 dark:border-gray-700/70 bg-white/40 dark:bg-gray-900/30 px-3 py-2.5 text-xs text-gray-600 dark:text-gray-300 space-y-1">
                  <p>
                    <span className="font-medium text-gray-800 dark:text-gray-100">{t.liveRoutes}:</span>{' '}
                    {liveRoutes.join(', ')}
                  </p>
                  {comingSoon.length > 0 && (
                    <p>
                      <span className="font-medium text-gray-800 dark:text-gray-100">{t.comingSoon}:</span>{' '}
                      {comingSoon.join(', ')}
                    </p>
                  )}
                </div>
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
              <Button variant="primary" size="lg" fullWidth onClick={() => router.push('/home')}>
                {t.continue}
              </Button>
            </div>
          )}
        </Card>
      </div>
    </Container>
  );
}
