'use client';

import React from 'react';
import { Card } from '@/components/UI/Card';
import { Badge } from '@/components/UI/Badge';
import { Icon, CopyIcon, CheckIcon } from '@/components/Icons';
import { Button } from '@/components/UI/Button';
import type { Transaction, Language } from '@/types';
import { useState } from 'react';

interface TransactionDetailsProps {
  transaction: Transaction;
  language: Language;
}

export function TransactionDetails({ transaction, language }: TransactionDetailsProps) {
  const [copied, setCopied] = useState<string | null>(null);

  const labels = {
    en: {
      status: 'Status',
      type: 'Type',
      amount: 'Amount',
      from: 'From',
      to: 'To',
      fee: 'Fee',
      timestamp: 'Date & Time',
      hash: 'Transaction Hash',
      description: 'Description',
      copy: 'Copy',
      copied: 'Copied!',
      viewOnExplorer: 'View on Explorer',
    },
    es: {
      status: 'Estado',
      type: 'Tipo',
      amount: 'Cantidad',
      from: 'De',
      to: 'A',
      fee: 'Tarifa',
      timestamp: 'Fecha y Hora',
      hash: 'Hash de Transacción',
      description: 'Descripción',
      copy: 'Copiar',
      copied: '¡Copiado!',
      viewOnExplorer: 'Ver en Explorador',
    },
  };

  const t = labels[language];

  const handleCopy = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return new Intl.DateTimeFormat(language === 'en' ? 'en-US' : 'es-MX', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const getStatusBadge = (status: Transaction['status']) => {
    const variants = {
      pending: 'warning' as const,
      completed: 'success' as const,
      failed: 'error' as const,
      cancelled: 'default' as const,
    };
    return <Badge variant={variants[status]} size="md">{status}</Badge>;
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-gray-600 mb-1">{t.status}</p>
          {getStatusBadge(transaction.status)}
        </div>
        <div>
          <p className="text-sm text-gray-600 mb-1">{t.type}</p>
          <p className="font-semibold text-gray-900 capitalize">{transaction.type}</p>
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <p className="text-sm text-gray-600 mb-1">{t.amount}</p>
          <div className="flex items-center gap-2">
            <p className="font-bold text-lg text-gray-900">
              {transaction.toAmount.toFixed(2)} {transaction.toToken}
            </p>
            {transaction.fromToken !== transaction.toToken && (
              <span className="text-sm text-gray-500">
                ({transaction.fromAmount.toFixed(2)} {transaction.fromToken})
              </span>
            )}
          </div>
        </div>

        {transaction.fromAddress && (
          <div>
            <p className="text-sm text-gray-600 mb-1">{t.from}</p>
            <div className="flex items-center gap-2">
              <code className="text-xs font-mono text-gray-900 bg-gray-100 px-2 py-1 rounded flex-1 truncate">
                {transaction.fromAddress}
              </code>
              <button
                onClick={() => handleCopy(transaction.fromAddress!, 'from')}
                className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                aria-label={t.copy}
              >
                <Icon color={copied === 'from' ? 'success' : 'gray'} size="sm">
                  {copied === 'from' ? <CheckIcon /> : <CopyIcon />}
                </Icon>
              </button>
            </div>
          </div>
        )}

        {transaction.toAddress && (
          <div>
            <p className="text-sm text-gray-600 mb-1">{t.to}</p>
            <div className="flex items-center gap-2">
              <code className="text-xs font-mono text-gray-900 bg-gray-100 px-2 py-1 rounded flex-1 truncate">
                {transaction.toAddress}
              </code>
              <button
                onClick={() => handleCopy(transaction.toAddress!, 'to')}
                className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                aria-label={t.copy}
              >
                <Icon color={copied === 'to' ? 'success' : 'gray'} size="sm">
                  {copied === 'to' ? <CheckIcon /> : <CopyIcon />}
                </Icon>
              </button>
            </div>
          </div>
        )}

        {transaction.fee !== undefined && (
          <div>
            <p className="text-sm text-gray-600 mb-1">{t.fee}</p>
            <p className="font-semibold text-gray-900">
              {transaction.fee.toFixed(4)} {transaction.fromToken}
            </p>
          </div>
        )}

        <div>
          <p className="text-sm text-gray-600 mb-1">{t.timestamp}</p>
          <p className="font-semibold text-gray-900">{formatDate(transaction.timestamp)}</p>
        </div>

        {transaction.hash && (
          <div>
            <p className="text-sm text-gray-600 mb-1">{t.hash}</p>
            <div className="flex items-center gap-2">
              <code className="text-xs font-mono text-gray-900 bg-gray-100 px-2 py-1 rounded flex-1 truncate">
                {transaction.hash}
              </code>
              <button
                onClick={() => handleCopy(transaction.hash!, 'hash')}
                className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                aria-label={t.copy}
              >
                <Icon color={copied === 'hash' ? 'success' : 'gray'} size="sm">
                  {copied === 'hash' ? <CheckIcon /> : <CopyIcon />}
                </Icon>
              </button>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="mt-2"
              onClick={() => {
                // Mock: In real app, this would open blockchain explorer
                window.open(`https://explorer.celo.org/tx/${transaction.hash}`, '_blank');
              }}
            >
              {t.viewOnExplorer}
            </Button>
          </div>
        )}

        {transaction.description && (
          <div>
            <p className="text-sm text-gray-600 mb-1">{t.description}</p>
            <p className="text-gray-900">{transaction.description}</p>
          </div>
        )}
      </div>
    </div>
  );
}

