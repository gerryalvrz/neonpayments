'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { Container } from '@/components/Layout/Container';
import { Header } from '@/components/Layout/Header';
import { Card } from '@/components/UI/Card';
import { Button } from '@/components/UI/Button';
import { Badge } from '@/components/UI/Badge';
import { Icon, CreditCardIcon, WalletIcon, SendIcon, CheckCircleIcon, ArrowDownIcon, SwapIcon, HistoryIcon, BellIcon, SettingsIcon, QRIcon } from '@/components/Icons';

export function HomeScreen() {
  const router = useRouter();
  const { user, mercadoPago, walletBalance, transactions, notifications, language } = useApp();

  const labels = {
    en: {
      title: 'Welcome to NeonPay MX',
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
    },
    es: {
      title: 'Bienvenido a NeonPay MX',
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
    },
  };

  const t = labels[language];

  if (!user) {
    return (
      <Container>
        <div className="min-h-screen flex items-center justify-center py-12">
          <Card padding="lg" className="max-w-md w-full text-center">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{t.title}</h1>
            <p className="text-gray-600 dark:text-gray-300 mb-6">{t.subtitle}</p>
            <Button
              variant="primary"
              size="lg"
              fullWidth
              onClick={() => router.push('/auth')}
            >
              <Icon>
                <WalletIcon />
              </Icon>
              {t.connectWallet}
            </Button>
          </Card>
        </div>
      </Container>
    );
  }

  // Calculate total balance
  const totalBalance = (walletBalance.cUSD || 0) + (walletBalance.USDC || 0) + (walletBalance.USDT || 0);
  const recentTransactions = transactions.slice(0, 3);
  const unreadCount = notifications.filter(n => !n.read).length;

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
          <div className="grid grid-cols-3 gap-4 pt-6 border-t border-gray-200/50 dark:border-gray-700/50">
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">cUSD</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white financial-number">{walletBalance.cUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">USDC</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white financial-number">{walletBalance.USDC.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">USDT</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white financial-number">{walletBalance.USDT.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            </div>
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
          {!mercadoPago.connected ? (
            <Card variant="interactive" padding="lg" onClick={() => router.push('/connect-mercado')} className="group">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-br from-acid-lemon/20 to-acid-lemon/10 rounded-xl group-hover:scale-110 transition-transform duration-200">
                  <Icon size="lg" color="neon">
                    <CreditCardIcon />
                  </Icon>
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 dark:text-white mb-1">{t.connectMercado}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Link your Mercado Pago account</p>
                </div>
              </div>
            </Card>
          ) : (
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
    </Container>
  );
}
