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
import { Select } from '@/components/UI/Select';
import { Badge } from '@/components/UI/Badge';
import { Icon, QRIcon, CopyIcon, CheckIcon, ArrowDownIcon } from '@/components/Icons';
import { QRCodeSVG } from 'qrcode.react';

type Token = 'cUSD' | 'USDC' | 'USDT';

export function ReceiveScreen() {
  const router = useRouter();
  const { user, walletBalance, language } = useApp();
  const { showToast } = useToast();
  const [selectedToken, setSelectedToken] = useState<Token>('USDC');
  const [amount, setAmount] = useState('');
  const [copied, setCopied] = useState(false);

  const labels = {
    en: {
      title: 'Receive Payment',
      subtitle: 'Share your address or generate a payment request',
      address: 'Your Wallet Address',
      qrCode: 'QR Code',
      amount: 'Request Amount (Optional)',
      token: 'Token',
      copy: 'Copy Address',
      copied: 'Copied!',
      share: 'Share',
      generateQR: 'Generate Payment Request',
      balance: 'Balance',
      paymentRequest: 'Payment Request',
      scanQR: 'Scan this QR code to send payment',
    },
    es: {
      title: 'Recibir Pago',
      subtitle: 'Comparte tu dirección o genera una solicitud de pago',
      address: 'Tu Dirección de Billetera',
      qrCode: 'Código QR',
      amount: 'Cantidad Solicitada (Opcional)',
      token: 'Token',
      copy: 'Copiar Dirección',
      copied: '¡Copiado!',
      share: 'Compartir',
      generateQR: 'Generar Solicitud de Pago',
      balance: 'Saldo',
      paymentRequest: 'Solicitud de Pago',
      scanQR: 'Escanea este código QR para enviar pago',
    },
  };

  const t = labels[language];

  const tokenOptions = [
    { value: 'cUSD', label: 'cUSD' },
    { value: 'USDC', label: 'USDC' },
    { value: 'USDT', label: 'USDT' },
  ];

  const walletAddress = user?.walletAddress || '0x0000000000000000000000000000000000000000';

  const handleCopy = async () => {
    if (walletAddress) {
      await navigator.clipboard.writeText(walletAddress);
      setCopied(true);
      showToast({
        type: 'success',
        message: t.copied,
      });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: t.paymentRequest,
          text: `${t.paymentRequest}: ${walletAddress}${amount ? `\n${t.amount}: ${amount} ${selectedToken}` : ''}`,
        });
      } catch (err) {
        // User cancelled or error
      }
    } else {
      // Fallback: copy to clipboard
      const text = `${t.paymentRequest}\n${walletAddress}${amount ? `\n${t.amount}: ${amount} ${selectedToken}` : ''}`;
      await navigator.clipboard.writeText(text);
      showToast({
        type: 'success',
        message: t.copied,
      });
    }
  };

  // Generate QR code data
  const generateQRData = () => {
    if (amount) {
      return `${walletAddress}?amount=${amount}&token=${selectedToken}`;
    }
    return walletAddress;
  };

  const balance = walletBalance[selectedToken] || 0;

  return (
    <Container>
      <div className="py-8">
        <BackButton />
        
        <Card padding="lg" className="max-w-md mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{t.title}</h1>
          <p className="text-gray-600 dark:text-gray-300 mb-6">{t.subtitle}</p>

          <div className="space-y-6">
            {/* Token Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t.token}</label>
              <Select
                options={tokenOptions}
                value={selectedToken}
                onChange={(value) => setSelectedToken(value as Token)}
              />
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                {t.balance}: {balance.toFixed(2)} {selectedToken}
              </p>
            </div>

            {/* Optional Amount */}
            <div>
              <Input
                type="number"
                label={t.amount}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                min="0"
                step="0.01"
              />
            </div>

            {/* Wallet Address */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t.address}</label>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-xs font-mono text-gray-900 dark:text-gray-100 bg-gray-100 dark:bg-gray-800 px-3 py-2 rounded-lg break-all">
                  {walletAddress}
                </code>
                <button
                  onClick={handleCopy}
                  className="p-2 bg-acid-lemon hover:bg-acid-lemon-light rounded-lg transition-colors flex-shrink-0"
                  aria-label={t.copy}
                >
                  <Icon color={copied ? 'success' : 'gray'} size="md">
                    {copied ? <CheckIcon /> : <CopyIcon />}
                  </Icon>
                </button>
              </div>
            </div>

            {/* QR Code */}
            <div className="text-center">
              <div className="inline-block p-4 bg-white dark:bg-gray-800 rounded-lg border-2 border-acid-lemon">
                <QRCodeSVG
                  value={generateQRData()}
                  size={192}
                  level="H"
                  includeMargin={true}
                  className="mx-auto"
                />
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">{t.scanQR}</p>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <Button
                variant="primary"
                size="lg"
                fullWidth
                onClick={handleCopy}
              >
                <Icon>
                  <CopyIcon />
                </Icon>
                {t.copy}
              </Button>
              <Button
                variant="secondary"
                size="lg"
                fullWidth
                onClick={handleShare}
              >
                {t.share}
              </Button>
            </div>

            {/* Payment Request Info */}
            {amount && (
              <Card variant="elevated" padding="md" className="bg-acid-lemon/10">
                <div className="flex items-center gap-2 mb-2">
                  <Icon color="neon" size="sm">
                    <ArrowDownIcon />
                  </Icon>
                  <h3 className="font-semibold text-gray-900 dark:text-white">{t.paymentRequest}</h3>
                </div>
                <div className="text-sm text-gray-700 dark:text-gray-300">
                  <p>
                    <span className="font-medium">{t.amount}:</span> {amount} {selectedToken}
                  </p>
                  <p className="mt-1 text-xs text-gray-600">
                    {t.scanQR}
                  </p>
                </div>
              </Card>
            )}
          </div>
        </Card>
      </div>
    </Container>
  );
}

