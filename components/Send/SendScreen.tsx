'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
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
import { Icon, QRIcon, MapMarkerIcon } from '@/components/Icons';
import { resolveToAddress, isCNSName, formatAddress } from '@/utils/cns';

// Dynamically import QRScanner to avoid SSR issues with html5-qrcode
const QRScanner = dynamic(() => import('@/components/UI/QRScanner'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-64 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg">
      <p className="text-gray-600 dark:text-gray-400">Loading scanner...</p>
    </div>
  ),
});

type Step = 'method' | 'address' | 'amount' | 'confirm' | 'processing' | 'success';
type Method = 'address' | 'qr';

export function SendScreen() {
  const router = useRouter();
  const { user, walletBalance, setWalletBalance, addTransaction, language } = useApp();
  const { showToast } = useToast();
  const [step, setStep] = useState<Step>('method');
  const [method, setMethod] = useState<Method>('address');
  const [address, setAddress] = useState('');
  const [resolvedAddress, setResolvedAddress] = useState<string | null>(null);
  const [isResolving, setIsResolving] = useState(false);
  const [amount, setAmount] = useState('');
  const [token, setToken] = useState<'cUSD' | 'USDC' | 'USDT'>('USDC');
  const [progress, setProgress] = useState(0);

  const labels = {
    en: {
      title: 'Send Payment',
      method: 'Select Method',
      address: 'Wallet Address',
      qr: 'QR Code',
      enterAddress: 'Enter wallet address or CNS name',
      scanQR: 'Scan QR Code',
      scanError: 'Failed to scan QR code',
      invalidQR: 'Invalid QR code format',
      resolving: 'Resolving name...',
      invalidAddress: 'Invalid address or CNS name',
      nameNotFound: 'CNS name not found',
      amount: 'Amount',
      token: 'Token',
      review: 'Review Transaction',
      to: 'To',
      confirm: 'Confirm',
      processing: 'Processing...',
      success: 'Payment Sent Successfully!',
      continue: 'Continue',
    },
    es: {
      title: 'Enviar Pago',
      method: 'Seleccionar Método',
      address: 'Dirección de Billetera',
      qr: 'Código QR',
      enterAddress: 'Ingresa la dirección de billetera o nombre CNS',
      scanQR: 'Escanear Código QR',
      scanError: 'Error al escanear código QR',
      invalidQR: 'Formato de código QR inválido',
      resolving: 'Resolviendo nombre...',
      invalidAddress: 'Dirección o nombre CNS inválido',
      nameNotFound: 'Nombre CNS no encontrado',
      amount: 'Cantidad',
      token: 'Token',
      review: 'Revisar Transacción',
      to: 'A',
      confirm: 'Confirmar',
      processing: 'Procesando...',
      success: '¡Pago Enviado Exitosamente!',
      continue: 'Continuar',
    },
  };

  const t = labels[language];

  const handleMethodSelect = (selectedMethod: Method) => {
    setMethod(selectedMethod);
    setStep('address');
  };

  const handleQRScan = async (decodedText: string) => {
    try {
      let scannedAddress = decodedText;
      let amountParam: string | null = null;
      let tokenParam: string | null = null;

      // Check if QR contains query parameters
      if (decodedText.includes('?')) {
        const [addressPart, queryPart] = decodedText.split('?');
        scannedAddress = addressPart;
        
        // Parse query parameters manually
        const params = new URLSearchParams(queryPart);
        amountParam = params.get('amount');
        tokenParam = params.get('token');
      }

      // Validate and resolve address (could be hash or CNS name)
      if (!scannedAddress || scannedAddress.trim().length < 3) {
        showToast({
          type: 'error',
          message: t.invalidQR,
        });
        return;
      }

      setAddress(scannedAddress);
      
      // Try to resolve if it's a CNS name
      if (isCNSName(scannedAddress)) {
        setIsResolving(true);
        const resolved = await resolveToAddress(scannedAddress);
        if (resolved) {
          setResolvedAddress(resolved);
        } else {
          showToast({
            type: 'error',
            message: t.nameNotFound,
          });
          setIsResolving(false);
          return;
        }
        setIsResolving(false);
      } else {
        setResolvedAddress(scannedAddress);
      }

      // Extract amount and token from query params if present
      if (amountParam) {
        setAmount(amountParam);
      }
      if (tokenParam && ['cUSD', 'USDC', 'USDT'].includes(tokenParam)) {
        setToken(tokenParam as 'cUSD' | 'USDC' | 'USDT');
      }

      // Move to amount step (or confirm if amount was in QR)
      if (amountParam) {
        // Validate amount before proceeding
        const numAmount = parseFloat(amountParam);
        const selectedToken = tokenParam || token;
        const balance = walletBalance[selectedToken === 'cUSD' ? 'cUSD' : selectedToken === 'USDC' ? 'USDC' : 'USDT'];
        if (numAmount > 0 && numAmount <= balance) {
          setStep('confirm');
        } else {
          setStep('amount');
        }
      } else {
        setStep('amount');
      }

      showToast({
        type: 'success',
        message: 'QR code scanned successfully',
      });
    } catch (error) {
      console.error('Error parsing QR code:', error);
      showToast({
        type: 'error',
        message: t.invalidQR,
      });
    }
  };

  const handleQRScanError = (error: string) => {
    console.error('QR scan error:', error);
    // Don't show toast for every scan error, only for critical ones
  };

  const handleAddressNext = async () => {
    if (!address.trim()) {
      return;
    }

    setIsResolving(true);
    try {
      const resolved = await resolveToAddress(address);
      
      if (!resolved) {
        showToast({
          type: 'error',
          message: isCNSName(address) ? t.nameNotFound : t.invalidAddress,
        });
        setIsResolving(false);
        return;
      }

      setResolvedAddress(resolved);
      setIsResolving(false);
      setStep('amount');
    } catch (error) {
      console.error('Error resolving address:', error);
      showToast({
        type: 'error',
        message: t.invalidAddress,
      });
      setIsResolving(false);
    }
  };

  const handleAmountNext = () => {
    const numAmount = parseFloat(amount);
    const balance = walletBalance[token === 'cUSD' ? 'cUSD' : token === 'USDC' ? 'USDC' : 'USDT'];
    if (numAmount > 0 && numAmount <= balance) {
      setStep('confirm');
    }
  };

  const handleConfirm = async () => {
    // Ensure we have a resolved address
    const finalAddress = resolvedAddress || address;
    if (!finalAddress) {
      showToast({
        type: 'error',
        message: t.invalidAddress,
      });
      return;
    }

    setStep('processing');
    
    // Simulate transaction
    for (let i = 0; i <= 100; i += 10) {
      await new Promise(resolve => setTimeout(resolve, 200));
      setProgress(i);
    }

    // Update wallet balance
    const numAmount = parseFloat(amount);
    setWalletBalance({
      ...walletBalance,
      [token === 'cUSD' ? 'cUSD' : token === 'USDC' ? 'USDC' : 'USDT']:
        walletBalance[token === 'cUSD' ? 'cUSD' : token === 'USDC' ? 'USDC' : 'USDT'] - numAmount,
    });

    // Add transaction to history
    const transaction = {
      id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'send' as const,
      status: 'completed' as const,
      fromToken: token,
      toToken: token,
      fromAmount: numAmount,
      toAmount: numAmount,
      fromAddress: user?.walletAddress,
      toAddress: finalAddress,
      timestamp: Date.now(),
      fee: numAmount * 0.001,
      hash: `0x${Math.random().toString(16).substr(2, 64)}`,
    };
    addTransaction(transaction);

    showToast({
      type: 'success',
      message: t.success,
    });

    setStep('success');
  };

  const handleContinue = () => {
    router.push('/');
  };

  return (
    <Container>
      <div className="py-8">
        <BackButton />
        
        <Card padding="xl" className="max-w-md mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-2 tracking-tight">{t.title}</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Send payments securely</p>
          </div>

          {step === 'method' && (
            <div className="space-y-4">
              <p className="text-gray-600 dark:text-gray-300 mb-4">{t.method}</p>
              <Button
                variant="secondary"
                size="lg"
                fullWidth
                onClick={() => handleMethodSelect('address')}
              >
                <Icon>
                  <MapMarkerIcon />
                </Icon>
                {t.address}
              </Button>
              <Button
                variant="secondary"
                size="lg"
                fullWidth
                onClick={() => handleMethodSelect('qr')}
              >
                <Icon>
                  <QRIcon />
                </Icon>
                {t.qr}
              </Button>
            </div>
          )}

          {step === 'address' && method === 'qr' && (
            <div className="space-y-4">
              <QRScanner
                onScanSuccess={handleQRScan}
                onScanError={handleQRScanError}
                onClose={() => setStep('method')}
              />
              {address && (
                <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">Scanned Address:</p>
                  <code className="text-xs font-mono text-gray-900 dark:text-gray-100 break-all">
                    {address}
                  </code>
                </div>
              )}
            </div>
          )}

          {step === 'address' && method === 'address' && (
            <div className="space-y-4">
              <Input
                label={t.address}
                placeholder={t.enterAddress}
                value={address}
                onChange={(e) => {
                  setAddress(e.target.value);
                  setResolvedAddress(null); // Clear resolved address when input changes
                }}
              />
              {isCNSName(address) && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {language === 'en' 
                    ? 'CNS names like "name.celo.eth" are supported' 
                    : 'Se admiten nombres CNS como "nombre.celo.eth"'}
                </p>
              )}
              {resolvedAddress && (
                <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <p className="text-xs text-green-700 dark:text-green-300 mb-1">
                    {language === 'en' ? 'Resolved to:' : 'Resuelto a:'}
                  </p>
                  <code className="text-xs font-mono text-green-900 dark:text-green-100 break-all">
                    {resolvedAddress}
                  </code>
                </div>
              )}
              <Button
                variant="primary"
                size="lg"
                fullWidth
                onClick={handleAddressNext}
                disabled={!address.trim() || isResolving}
              >
                {isResolving ? t.resolving : t.continue}
              </Button>
            </div>
          )}

          {step === 'amount' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t.token}</label>
                <div className="flex gap-2">
                  {(['cUSD', 'USDC', 'USDT'] as const).map((tkn) => (
                    <Button
                      key={tkn}
                      variant={token === tkn ? 'primary' : 'secondary'}
                      size="sm"
                      onClick={() => setToken(tkn)}
                    >
                      {tkn}
                    </Button>
                  ))}
                </div>
              </div>
              <Input
                type="number"
                label={t.amount}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                min="0"
                step="0.01"
              />
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Available: <span className="font-bold text-gray-900 dark:text-white financial-number">{walletBalance[token === 'cUSD' ? 'cUSD' : token === 'USDC' ? 'USDC' : 'USDT'].toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span> {token}
              </p>
              <Button
                variant="primary"
                size="lg"
                fullWidth
                onClick={handleAmountNext}
                disabled={!amount || parseFloat(amount) <= 0}
              >
                {t.continue}
              </Button>
            </div>
          )}

          {step === 'confirm' && (
            <div className="space-y-4">
              <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-300">{t.to}</span>
                    {isCNSName(address) ? (
                      <div className="text-right">
                        <div className="text-sm font-semibold text-gray-900 dark:text-white">{address}</div>
                        <code className="text-xs font-mono text-gray-500 dark:text-gray-400">{formatAddress(resolvedAddress || address)}</code>
                      </div>
                    ) : (
                      <code className="text-xs font-mono text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 px-2 py-1 rounded border border-gray-200 dark:border-gray-700">{formatAddress(resolvedAddress || address)}</code>
                    )}
                  </div>
                </div>
                <div className="flex justify-between items-center pt-3 border-t border-gray-200 dark:border-gray-700">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-300">{t.amount}</span>
                  <span className="font-bold text-lg text-gray-900 dark:text-white financial-number">{parseFloat(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-sm font-semibold text-gray-600 dark:text-gray-300">{token}</span></span>
                </div>
              </div>
              <Button
                variant="primary"
                size="lg"
                fullWidth
                onClick={handleConfirm}
              >
                {t.confirm}
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
