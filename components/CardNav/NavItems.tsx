'use client';

import { useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import type { CardNavItem } from './CardNav';

type CardNavLink = {
  label: string;
  href?: string;
  ariaLabel: string;
};

const LABELS = {
  en: {
    wallet: 'Wallet',
    payments: 'Payments',
    account: 'Account',
    home: 'Home',
    receive: 'Receive',
    transactions: 'Transactions',
    activity: 'Activity',
    sendMoney: 'Send Money',
    addFunds: 'Add Funds',
    payServices: 'Pay Services',
    swapTokens: 'Swap Tokens',
    verifyIdentity: 'Verify Identity',
    settings: 'Settings',
  },
  es: {
    wallet: 'Billetera',
    payments: 'Pagos',
    account: 'Cuenta',
    home: 'Inicio',
    receive: 'Recibir',
    transactions: 'Transacciones',
    activity: 'Actividad',
    sendMoney: 'Enviar Dinero',
    addFunds: 'Agregar Fondos',
    payServices: 'Pagar Servicios',
    swapTokens: 'Intercambiar Tokens',
    verifyIdentity: 'Verificar Identidad',
    settings: 'Configuración',
  },
} as const;

export function useNavItems(): CardNavItem[] {
  const { user, language, theme } = useApp();
  const isDark = theme === 'dark';
  const showVerify = Boolean(user && !user.selfVerified);

  return useMemo<CardNavItem[]>(() => {
    const t = LABELS[language];

    const walletLinks: CardNavLink[] = [
      { label: t.home, href: '/', ariaLabel: 'Go to Home' },
      { label: t.receive, href: '/receive', ariaLabel: 'Receive Payment' },
      { label: t.transactions, href: '/transactions', ariaLabel: 'View Transactions' },
      { label: t.activity, href: '/activity', ariaLabel: 'View Activity' },
    ];

    const paymentLinks: CardNavLink[] = [
      { label: t.sendMoney, href: '/send', ariaLabel: 'Send Money' },
      { label: t.addFunds, href: '/topup', ariaLabel: 'Add Funds' },
      { label: 'Mercado Pago', href: '/mercado-pago', ariaLabel: 'Mercado Pago' },
      { label: t.payServices, href: '/services', ariaLabel: 'Pay Services' },
      { label: t.swapTokens, href: '/swap', ariaLabel: 'Swap Tokens' },
    ];

    const accountLinks: CardNavLink[] = [
      ...(showVerify
        ? [{ label: t.verifyIdentity, href: '/verify-self', ariaLabel: 'Verify Identity' }]
        : []),
      { label: t.settings, href: '/settings', ariaLabel: 'Account Settings' },
    ];

    return [
      {
        label: t.wallet,
        bgColor: isDark ? 'rgba(59, 130, 246, 0.25)' : 'rgba(59, 130, 246, 0.15)',
        textColor: isDark ? '#93c5fd' : '#1e40af',
        links: walletLinks,
      },
      {
        label: t.payments,
        bgColor: isDark ? 'rgba(34, 197, 94, 0.25)' : 'rgba(34, 197, 94, 0.15)',
        textColor: isDark ? '#86efac' : '#15803d',
        links: paymentLinks,
      },
      {
        label: t.account,
        bgColor: isDark ? 'rgba(168, 85, 247, 0.25)' : 'rgba(168, 85, 247, 0.15)',
        textColor: isDark ? '#c4b5fd' : '#7c3aed',
        links: accountLinks,
      },
    ];
  }, [language, isDark, showVerify]);
}
