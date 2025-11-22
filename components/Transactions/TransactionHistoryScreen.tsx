'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { Container } from '@/components/Layout/Container';
import { BackButton } from '@/components/Layout/BackButton';
import { Card } from '@/components/UI/Card';
import { Badge } from '@/components/UI/Badge';
import { Tabs } from '@/components/UI/Tabs';
import { Modal } from '@/components/UI/Modal';
import { Icon, HistoryIcon, ArrowUpIcon, ArrowDownIcon, SendIcon, SwapIcon, CreditCardIcon } from '@/components/Icons';
import type { Transaction, TransactionType, TransactionStatus } from '@/types';
import { TransactionDetails } from './TransactionDetails';

export function TransactionHistoryScreen() {
  const router = useRouter();
  const { transactions, language } = useApp();
  const [activeTab, setActiveTab] = useState<'all' | TransactionType>('all');
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [statusFilter, setStatusFilter] = useState<TransactionStatus | 'all'>('all');

  const labels = {
    en: {
      title: 'Transaction History',
      all: 'All',
      send: 'Send',
      receive: 'Receive',
      swap: 'Swap',
      topup: 'Top Up',
      withdraw: 'Withdraw',
      service: 'Service',
      noTransactions: 'No transactions yet',
      noTransactionsDesc: 'Your transaction history will appear here',
      status: 'Status',
      allStatus: 'All Status',
      pending: 'Pending',
      completed: 'Completed',
      failed: 'Failed',
      cancelled: 'Cancelled',
    },
    es: {
      title: 'Historial de Transacciones',
      all: 'Todas',
      send: 'Enviar',
      receive: 'Recibir',
      swap: 'Intercambiar',
      topup: 'Recargar',
      withdraw: 'Retirar',
      service: 'Servicio',
      noTransactions: 'Aún no hay transacciones',
      noTransactionsDesc: 'Tu historial de transacciones aparecerá aquí',
      status: 'Estado',
      allStatus: 'Todos los Estados',
      pending: 'Pendiente',
      completed: 'Completado',
      failed: 'Fallido',
      cancelled: 'Cancelado',
    },
  };

  const t = labels[language];

  const tabs = [
    { id: 'all', label: t.all },
    { id: 'send', label: t.send },
    { id: 'receive', label: t.receive },
    { id: 'swap', label: t.swap },
    { id: 'topup', label: t.topup },
  ];

  const statusOptions = [
    { id: 'all', label: t.allStatus },
    { id: 'pending', label: t.pending },
    { id: 'completed', label: t.completed },
    { id: 'failed', label: t.failed },
    { id: 'cancelled', label: t.cancelled },
  ] as const;

  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      const typeMatch = activeTab === 'all' || tx.type === activeTab;
      const statusMatch = statusFilter === 'all' || tx.status === statusFilter;
      return typeMatch && statusMatch;
    });
  }, [transactions, activeTab, statusFilter]);

  const getTransactionIcon = (type: TransactionType) => {
    switch (type) {
      case 'send':
        return <SendIcon />;
      case 'receive':
        return <ArrowDownIcon />;
      case 'swap':
        return <SwapIcon />;
      case 'topup':
        return <CreditCardIcon />;
      default:
        return <HistoryIcon />;
    }
  };

  const getStatusBadge = (status: TransactionStatus) => {
    const variants = {
      pending: 'warning' as const,
      completed: 'success' as const,
      failed: 'error' as const,
      cancelled: 'default' as const,
    };
    return <Badge variant={variants[status]} size="sm">{t[status]}</Badge>;
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return new Intl.DateTimeFormat(language === 'en' ? 'en-US' : 'es-MX', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  return (
    <Container>
      <div className="py-8">
        <BackButton />
        
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-2 tracking-tight">{t.title}</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">View and manage your transaction history</p>
        </div>

        <div className="space-y-4 mb-8">
          <Tabs
            tabs={tabs}
            activeTab={activeTab}
            onChange={(tab) => setActiveTab(tab as typeof activeTab)}
          />
          
          <div className="flex gap-2 flex-wrap">
            {statusOptions.map((status) => (
              <button
                key={status.id}
                onClick={() => setStatusFilter(status.id as typeof statusFilter)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  statusFilter === status.id
                    ? 'bg-acid-lemon text-gray-900 shadow-acid hover:shadow-acid-lg'
                    : 'bg-glass-white dark:bg-gray-800 border border-acid-lemon/20 text-gray-700 dark:text-gray-200 hover:bg-acid-lemon/10 dark:hover:bg-acid-lemon/20 hover:border-acid-lemon/30'
                }`}
              >
                {status.label}
              </button>
            ))}
          </div>
        </div>

        {filteredTransactions.length === 0 ? (
          <Card padding="xl" className="text-center py-16">
            <div className="p-4 bg-gray-100 rounded-2xl inline-block mb-6">
              <Icon size="xl" color="gray">
                <HistoryIcon />
              </Icon>
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{t.noTransactions}</h3>
            <p className="text-gray-500 dark:text-gray-400">{t.noTransactionsDesc}</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredTransactions.map((transaction) => (
              <Card
                key={transaction.id}
                variant="interactive"
                padding="md"
                onClick={() => setSelectedTransaction(transaction)}
                className="cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className={`p-3 rounded-xl flex-shrink-0 ${
                      transaction.type === 'send' ? 'bg-red-50' :
                      transaction.type === 'receive' ? 'bg-green-50' :
                      'bg-blue-50'
                    } group-hover:scale-110 transition-transform duration-200`}>
                      <Icon
                        color={
                          transaction.type === 'send' ? 'error' :
                          transaction.type === 'receive' ? 'success' :
                          'info'
                        }
                        size="md"
                      >
                        {getTransactionIcon(transaction.type)}
                      </Icon>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <h3 className="font-bold text-gray-900 dark:text-white capitalize">
                          {t[transaction.type]}
                        </h3>
                        {getStatusBadge(transaction.status)}
                      </div>
                      <p className="text-sm font-medium text-gray-500">
                        {formatDate(transaction.timestamp)}
                      </p>
                      {transaction.description && (
                        <p className="text-sm text-gray-500 mt-1 truncate">
                          {transaction.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-4">
                    <div className={`font-bold text-base financial-number mb-1 ${
                      transaction.type === 'receive' ? 'text-semantic-success' :
                      transaction.type === 'send' ? 'text-semantic-error' :
                      'text-gray-900 dark:text-white'
                    }`}>
                      {transaction.type === 'receive' ? '+' : transaction.type === 'send' ? '-' : ''}
                      {transaction.toAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-xs font-medium text-gray-500">{transaction.toToken}</span>
                    </div>
                    {transaction.fromToken !== transaction.toToken && (
                      <div className="text-xs font-medium text-gray-500 mt-1">
                        {transaction.fromAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {transaction.fromToken}
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        <Modal
          isOpen={!!selectedTransaction}
          onClose={() => setSelectedTransaction(null)}
          title={selectedTransaction ? t[selectedTransaction.type] : ''}
          size="md"
        >
          {selectedTransaction && (
            <TransactionDetails transaction={selectedTransaction} language={language} />
          )}
        </Modal>
      </div>
    </Container>
  );
}

