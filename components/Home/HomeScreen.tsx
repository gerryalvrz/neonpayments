'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { Container } from '@/components/Layout/Container';
import { Header } from '@/components/Layout/Header';
import { Card } from '@/components/UI/Card';
import { Button } from '@/components/UI/Button';
import { Badge } from '@/components/UI/Badge';
import { Modal } from '@/components/UI/Modal';
import { Icon, CreditCardIcon, WalletIcon, SendIcon, CheckCircleIcon, ArrowDownIcon, SwapIcon, HistoryIcon, BellIcon, SettingsIcon, QRIcon } from '@/components/Icons';
import { previewFeaturesEnabled } from '@/utils/preview';
import { useActivity } from '@/utils/useActivity';
import { activityToTransaction } from '@/utils/activity';
import {
  RIPIO_PAYMENT_SYMBOLS,
  USD_PAYMENT_SYMBOLS,
  defaultVisiblePaymentSymbols,
  mentoRegionGroups,
  migrateVisiblePaymentSymbols,
  paymentTokenGroups,
  type PaymentSymbol,
} from '@/config/tokens';
import { cn } from '@/utils/cn';

type DashboardTokenFamily = 'all' | 'mento' | 'ripio';
const DASHBOARD_FAMILY_KEY = 'neonpay:dashboard-token-family';
const DASHBOARD_VISIBLE_KEY = 'neonpay:dashboard-visible-tokens';

function parseVisibleTokens(raw: string | null): PaymentSymbol[] {
  if (!raw) return defaultVisiblePaymentSymbols();
  try {
    return migrateVisiblePaymentSymbols(JSON.parse(raw));
  } catch {
    return defaultVisiblePaymentSymbols();
  }
}

export function HomeScreen() {
  const router = useRouter();
  const { user, mercadoPago, walletBalance, notifications, language, wallet } = useApp();
  const [tokenFamily, setTokenFamily] = useState<DashboardTokenFamily>('all');
  const [visibleTokens, setVisibleTokens] = useState<PaymentSymbol[]>(() => defaultVisiblePaymentSymbols());
  const [pickerTokensOpen, setPickerTokensOpen] = useState(false);
  const [draftVisible, setDraftVisible] = useState<PaymentSymbol[]>(() => defaultVisiblePaymentSymbols());

  useEffect(() => {
    try {
      const savedFamily = localStorage.getItem(DASHBOARD_FAMILY_KEY);
      if (savedFamily === 'all' || savedFamily === 'mento' || savedFamily === 'ripio') {
        setTokenFamily(savedFamily);
      }
      setVisibleTokens(parseVisibleTokens(localStorage.getItem(DASHBOARD_VISIBLE_KEY)));
    } catch {}
  }, []);

  // /home is logged-in only. Wait briefly for wallet→user sync or in-flight
  // connect, then always escape to landing so we never stick on "Abriendo…".
  useEffect(() => {
    if (user) return;

    const graceMs =
      wallet.isConnected || wallet.isConnecting || wallet.isMiniPay ? 8000 : 50;
    const timer = window.setTimeout(() => {
      router.replace('/');
    }, graceMs);

    return () => window.clearTimeout(timer);
  }, [user, wallet.isConnected, wallet.isConnecting, wallet.isMiniPay, router]);

  const selectTokenFamily = (next: DashboardTokenFamily) => {
    setTokenFamily(next);
    try {
      localStorage.setItem(DASHBOARD_FAMILY_KEY, next);
    } catch {}
  };

  const openTokenPicker = () => {
    setDraftVisible(visibleTokens);
    setPickerTokensOpen(true);
  };

  const saveVisibleTokens = () => {
    setVisibleTokens(draftVisible);
    setPickerTokensOpen(false);
    try {
      localStorage.setItem(DASHBOARD_VISIBLE_KEY, JSON.stringify(draftVisible));
    } catch {}
  };

  const toggleDraftToken = (symbol: PaymentSymbol) => {
    setDraftVisible((prev) =>
      prev.includes(symbol) ? prev.filter((row) => row !== symbol) : [...prev, symbol]
    );
  };

  const setDraftGroup = (symbols: readonly string[], selected: boolean) => {
    setDraftVisible((prev) => {
      const without = prev.filter((symbol) => !symbols.includes(symbol));
      return selected ? [...without, ...(symbols as PaymentSymbol[])] : without;
    });
  };

  const labels = {
    en: {
      title: 'Welcome to NeonPay',
      subtitle: 'Your gateway to seamless payments',
      connectWallet: 'Connect Wallet',
      connectMercado: 'Connect Mercado Pago',
      addFunds: 'Add Funds',
      sendPay: 'Send Payment',
      receive: 'Receive',
      swap: 'Swap Tokens',
      transactions: 'Transactions',
      activity: 'Activity',
      settings: 'Settings',
      verifyIdentity: 'Verify Identity',
      walletConnected: 'Wallet Connected',
      mercadoConnected: 'Mercado Pago Connected',
      totalBalance: 'Total Balance',
      recentTransactions: 'Recent Transactions',
      viewAll: 'View All',
      noTransactions: 'No recent transactions',
      unreadNotifications: 'unread',
      quickActions: 'Quick Actions',
      all: 'All',
      mento: 'Mento',
      ripio: 'Ripio',
      tokenFamily: 'Token family',
      ripioBalances: 'Ripio wFIAT',
      usdBalances: 'USD',
      chooseTokens: 'Choose tokens',
      chooseTokensTitle: 'Tokens to show',
      chooseTokensHint: 'Americas is on by default. Add Europe, Africa, or Asia-Pacific if you need those balances.',
      saveTokens: 'Save',
      selectGroup: 'All',
      hideGroup: 'None',
      noTokens: 'No tokens selected for this view.',
    },
    es: {
      title: 'Bienvenido a NeonPay',
      subtitle: 'Tu puerta de entrada a pagos sin problemas',
      connectWallet: 'Conectar Billetera',
      connectMercado: 'Conectar Mercado Pago',
      addFunds: 'Agregar Fondos',
      sendPay: 'Enviar Pago',
      receive: 'Recibir',
      swap: 'Intercambiar Tokens',
      transactions: 'Transacciones',
      activity: 'Actividad',
      settings: 'Configuración',
      verifyIdentity: 'Verificar Identidad',
      walletConnected: 'Billetera Conectada',
      mercadoConnected: 'Mercado Pago Conectado',
      totalBalance: 'Saldo Total',
      recentTransactions: 'Transacciones Recientes',
      viewAll: 'Ver Todas',
      noTransactions: 'Sin transacciones recientes',
      unreadNotifications: 'sin leer',
      quickActions: 'Acciones Rápidas',
      all: 'Todos',
      mento: 'Mento',
      ripio: 'Ripio',
      tokenFamily: 'Familia de tokens',
      ripioBalances: 'wFIAT de Ripio',
      usdBalances: 'USD',
      chooseTokens: 'Elegir tokens',
      chooseTokensTitle: 'Tokens a mostrar',
      chooseTokensHint: 'Américas está activo por defecto. Agrega Europa, África o Asia-Pacífico si necesitas esos saldos.',
      saveTokens: 'Guardar',
      selectGroup: 'Todos',
      hideGroup: 'Ninguno',
      noTokens: 'No hay tokens seleccionados para esta vista.',
    },
  };

  const t = labels[language];
  const { items: activityItems } = useActivity(wallet.address);
  const recentTransactions = activityItems.slice(0, 3).map(activityToTransaction);
  const unreadCount = notifications.filter(n => !n.read).length;
  const totalBalance = (walletBalance.USDm || 0) + (walletBalance.USDC || 0) + (walletBalance.USDT || 0);
  const visibleSet = new Set(visibleTokens);
  const mentoRegions = mentoRegionGroups(language).map((region) => ({
    ...region,
    shown: region.symbols.filter((symbol) => visibleSet.has(symbol)),
  }));
  const shownMento = mentoRegions.flatMap((region) => region.shown);
  const shownUsd = USD_PAYMENT_SYMBOLS.filter((symbol) => visibleSet.has(symbol));
  const shownRipio = RIPIO_PAYMENT_SYMBOLS.filter((symbol) => visibleSet.has(symbol));
  const familyTabs: { id: DashboardTokenFamily; label: string }[] = [
    { id: 'all', label: t.all },
    { id: 'mento', label: t.mento },
    { id: 'ripio', label: t.ripio },
  ];

  if (!user) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {wallet.isConnected || wallet.isConnecting || wallet.isMiniPay
            ? language === 'es'
              ? 'Abriendo NeonPay…'
              : 'Opening NeonPay…'
            : language === 'es'
              ? 'Ir al inicio…'
              : 'Going to home…'}
        </p>
      </div>
    );
  }

  return (
    <Container>
      <div className="py-8">
        <Header />
        
        {/* Total Balance Card - Enhanced */}
        <Card variant="premium" padding="xl" className="mb-8 bg-gradient-to-br from-acid-lemon/10 via-acid-lemon/5 to-transparent">
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">{t.totalBalance}</p>
              <h2 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-1 financial-number">
                ${totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-xl font-semibold text-gray-600 dark:text-gray-300">USDC</span>
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Available balance</p>
            </div>
            <div className="p-4 bg-gradient-to-br from-acid-lemon to-acid-lemon-light rounded-2xl shadow-acid-lg">
              <Icon color="gray" size="xl">
                <WalletIcon />
              </Icon>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 mb-5">
            <div
              className="inline-flex flex-wrap rounded-full border border-gray-200/70 dark:border-gray-700/70 bg-white/60 dark:bg-gray-900/40 p-1"
              role="tablist"
              aria-label={t.tokenFamily}
            >
              {familyTabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={tokenFamily === tab.id}
                  onClick={() => selectTokenFamily(tab.id)}
                  className={cn(
                    'px-3.5 py-1.5 text-base font-display tracking-wide rounded-full transition-all',
                    tokenFamily === tab.id
                      ? 'bg-acid-lemon text-gray-900 shadow-acid'
                      : 'text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white'
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <Button type="button" variant="ghost" size="sm" onClick={openTokenPicker}>
              {t.chooseTokens}
            </Button>
          </div>
          <div className="space-y-7 pt-2 border-t border-gray-200/50 dark:border-gray-700/50">
            {(tokenFamily === 'all' || tokenFamily === 'mento') &&
              mentoRegions.map((region) => (
                <DashboardTokenSection
                  key={region.id}
                  title={region.label}
                  symbols={region.shown}
                  walletBalance={walletBalance}
                />
              ))}
            {(tokenFamily === 'all' || tokenFamily === 'mento') && (
              <DashboardTokenSection title={t.usdBalances} symbols={shownUsd} walletBalance={walletBalance} />
            )}
            {(tokenFamily === 'all' || tokenFamily === 'ripio') && (
              <DashboardTokenSection title={t.ripioBalances} symbols={shownRipio} walletBalance={walletBalance} />
            )}
            {((tokenFamily === 'all' && !shownMento.length && !shownUsd.length && !shownRipio.length) ||
              (tokenFamily === 'mento' && !shownMento.length && !shownUsd.length) ||
              (tokenFamily === 'ripio' && !shownRipio.length)) && (
              <p className="text-sm text-gray-500 dark:text-gray-400">{t.noTokens}</p>
            )}
          </div>
        </Card>

        {/* Quick Actions - Enhanced */}
        <div className="mb-8">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">{t.quickActions}</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card
              variant="interactive"
              padding="lg"
              onClick={() => router.push('/send')}
              className="text-center group"
            >
              <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl inline-block mb-3 group-hover:scale-110 transition-transform duration-200">
                <Icon color="info" size="lg">
                  <SendIcon />
                </Icon>
              </div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">{t.sendPay}</p>
            </Card>

            <Card
              variant="interactive"
              padding="lg"
              onClick={() => router.push('/receive')}
              className="text-center group"
            >
              <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 rounded-2xl inline-block mb-3 group-hover:scale-110 transition-transform duration-200">
                <Icon color="success" size="lg">
                  <ArrowDownIcon />
                </Icon>
              </div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">{t.receive}</p>
            </Card>

            <Card
              variant="interactive"
              padding="lg"
              onClick={() => router.push('/swap')}
              className="text-center group"
            >
              <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30 rounded-2xl inline-block mb-3 group-hover:scale-110 transition-transform duration-200">
                <Icon color="info" size="lg">
                  <SwapIcon />
                </Icon>
              </div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">{t.swap}</p>
            </Card>

            <Card
              variant="interactive"
              padding="lg"
              onClick={() => router.push('/topup')}
              className="text-center group"
            >
              <div className="p-4 bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/30 dark:to-yellow-800/30 rounded-2xl inline-block mb-3 group-hover:scale-110 transition-transform duration-200">
                <Icon color="warning" size="lg">
                  <CreditCardIcon />
                </Icon>
              </div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">{t.addFunds}</p>
            </Card>
          </div>
        </div>

        {/* Recent Transactions - Enhanced */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">{t.recentTransactions}</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/transactions')}
              className="text-gray-600 hover:text-gray-900"
            >
              {t.viewAll} →
            </Button>
          </div>
          {recentTransactions.length === 0 ? (
            <Card padding="lg" className="text-center py-12">
              <div className="p-4 bg-gray-100 rounded-2xl inline-block mb-4">
                <Icon color="gray" size="xl">
                  <HistoryIcon />
                </Icon>
              </div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">{t.noTransactions}</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {recentTransactions.map((tx) => (
                <Card
                  key={tx.id}
                  variant="interactive"
                  padding="md"
                  onClick={() => router.push('/transactions')}
                  className="group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className={`p-3 rounded-xl flex-shrink-0 ${
                        tx.type === 'send' ? 'bg-red-50' :
                        tx.type === 'receive' ? 'bg-green-50' :
                        'bg-blue-50'
                      } group-hover:scale-110 transition-transform duration-200`}>
                        <Icon
                          color={tx.type === 'send' ? 'error' : tx.type === 'receive' ? 'success' : 'info'}
                          size="md"
                        >
                          {tx.type === 'send' ? <SendIcon /> : <ArrowDownIcon />}
                        </Icon>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 dark:text-white capitalize mb-1">{tx.type}</p>
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                          {new Date(tx.timestamp).toLocaleDateString(language === 'en' ? 'en-US' : 'es-MX', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 ml-4">
                      <p className={`font-bold text-base financial-number mb-1 ${
                        tx.type === 'receive' ? 'text-semantic-success' : 'text-gray-900 dark:text-white'
                      }`}>
                        {tx.type === 'receive' ? '+' : '-'}{tx.toAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-xs font-medium text-gray-500">{tx.toToken}</span>
                      </p>
                      <Badge variant={tx.status === 'completed' ? 'success' : 'warning'} size="sm">
                        {tx.status}
                      </Badge>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Additional Actions - Enhanced */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {previewFeaturesEnabled() && (
          <Card variant="interactive" padding="lg" onClick={() => router.push('/services')} className="group">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-acid-lemon/20 to-acid-lemon/10 rounded-xl group-hover:scale-110 transition-transform duration-200">
                <Icon size="lg" color="neon">
                  <CreditCardIcon />
                </Icon>
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-gray-900 dark:text-white mb-1">{language === 'en' ? 'Pay Services' : 'Pagar Servicios'}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{language === 'en' ? 'Pay bills and top-up services' : 'Paga facturas y recarga servicios'}</p>
              </div>
            </div>
          </Card>
        )}

          {!user.selfVerified && (
            <Card variant="interactive" padding="lg" onClick={() => router.push('/verify-self')} className="group">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-br from-acid-lemon/20 to-acid-lemon/10 dark:from-acid-lemon/30 dark:to-acid-lemon/20 rounded-xl group-hover:scale-110 transition-transform duration-200">
                  <Icon size="lg" color="neon">
                    <CheckCircleIcon />
                  </Icon>
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 dark:text-white mb-1">{t.verifyIdentity}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Verify your identity with Self Protocol</p>
                </div>
              </div>
            </Card>
          )}

          <Card variant="interactive" padding="lg" onClick={() => router.push('/activity')} className="group">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-acid-lemon/20 to-acid-lemon/10 dark:from-acid-lemon/30 dark:to-acid-lemon/20 rounded-xl group-hover:scale-110 transition-transform duration-200">
                <Icon size="lg" color="neon">
                  <BellIcon />
                </Icon>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-bold text-gray-900 dark:text-white">{t.activity}</h3>
                  {unreadCount > 0 && (
                    <Badge variant="error" size="sm">{unreadCount}</Badge>
                  )}
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">View notifications and activity</p>
              </div>
            </div>
          </Card>

          <Card variant="interactive" padding="lg" onClick={() => router.push('/settings')} className="group">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-acid-lemon/20 to-acid-lemon/10 dark:from-acid-lemon/30 dark:to-acid-lemon/20 rounded-xl group-hover:scale-110 transition-transform duration-200">
                <Icon size="lg" color="neon">
                  <SettingsIcon />
                </Icon>
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-gray-900 dark:text-white mb-1">{t.settings}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Manage your account settings</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
      <Modal
        isOpen={pickerTokensOpen}
        onClose={() => setPickerTokensOpen(false)}
        title={t.chooseTokensTitle}
        size="md"
      >
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-5">{t.chooseTokensHint}</p>
        <div className="space-y-5">
          {paymentTokenGroups(language).map((group) => {
            const selectedCount = group.symbols.filter((symbol) => draftVisible.includes(symbol)).length;
            return (
              <div key={group.id}>
                <div className="flex items-center justify-between gap-3 mb-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    {group.label}
                    <span className="ml-2 font-medium normal-case tracking-normal">
                      {selectedCount}/{group.symbols.length}
                    </span>
                  </p>
                  <div className="flex gap-1">
                    <Button type="button" variant="ghost" size="sm" onClick={() => setDraftGroup(group.symbols, true)}>
                      {t.selectGroup}
                    </Button>
                    <Button type="button" variant="ghost" size="sm" onClick={() => setDraftGroup(group.symbols, false)}>
                      {t.hideGroup}
                    </Button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {group.symbols.map((symbol) => {
                    const checked = draftVisible.includes(symbol);
                    return (
                      <button
                        key={symbol}
                        type="button"
                        aria-pressed={checked}
                        onClick={() => toggleDraftToken(symbol)}
                        className={cn(
                          'px-3 py-1.5 rounded-full text-sm font-semibold border transition-all',
                          checked
                            ? 'bg-acid-lemon text-gray-900 border-acid-lemon shadow-acid'
                            : 'bg-white/70 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700'
                        )}
                      >
                        {symbol}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-6">
          <Button type="button" variant="primary" size="lg" fullWidth onClick={saveVisibleTokens}>
            {t.saveTokens}
          </Button>
        </div>
      </Modal>
    </Container>
  );
}

function DashboardTokenSection({
  title,
  symbols,
  walletBalance,
}: {
  title: string;
  symbols: readonly string[];
  walletBalance: Record<string, number>;
}) {
  if (!symbols.length) return null;
  return (
    <div>
      <p className="font-display text-lg sm:text-xl text-gray-900 dark:text-white mb-4 tracking-wider">
        {title}
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-5">
        {symbols.map((symbol) => (
          <DashboardTokenBalance key={symbol} symbol={symbol} amount={walletBalance[symbol] || 0} />
        ))}
      </div>
    </div>
  );
}

function DashboardTokenBalance({ symbol, amount }: { symbol: string; amount: number }) {
  return (
    <div className="min-w-0">
      <p className="font-sans text-xs font-bold text-gray-700 dark:text-gray-300 mb-0.5 tracking-tight">
        {symbol}
      </p>
      <p className="financial-number text-xl sm:text-2xl font-bold text-gray-900 dark:text-white leading-tight">
        {amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </p>
    </div>
  );
}
