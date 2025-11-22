'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { Container } from '@/components/Layout/Container';
import { BackButton } from '@/components/Layout/BackButton';
import { Card } from '@/components/UI/Card';
import { Button } from '@/components/UI/Button';
import { Input } from '@/components/UI/Input';
import { Select, SelectOption } from '@/components/UI/Select';
import { Badge } from '@/components/UI/Badge';
import { Icon, MobileIcon, BoltIcon, WaterIcon, WifiIcon, BusIcon, ShoppingBagIcon, CreditCardIcon, CheckCircleIcon } from '@/components/Icons';
import type { ServiceCategory, ServiceProvider } from '@/types';

// Service providers available in Mexico via Mercado Pago
const serviceProviders: ServiceProvider[] = [
  // Mobile Top-ups
  { id: 'telcel', name: 'Telcel', category: 'mobile', requiresPhoneNumber: true, minAmount: 10, maxAmount: 1000 },
  { id: 'movistar', name: 'Movistar', category: 'mobile', requiresPhoneNumber: true, minAmount: 10, maxAmount: 1000 },
  { id: 'att', name: 'AT&T', category: 'mobile', requiresPhoneNumber: true, minAmount: 10, maxAmount: 1000 },
  { id: 'unefon', name: 'Unefon', category: 'mobile', requiresPhoneNumber: true, minAmount: 10, maxAmount: 1000 },
  
  // Utilities
  { id: 'cfe', name: 'CFE (Electricity)', category: 'utilities', requiresAccountNumber: true, minAmount: 50, maxAmount: 50000 },
  { id: 'aguas', name: 'Aguas de México', category: 'utilities', requiresAccountNumber: true, minAmount: 50, maxAmount: 50000 },
  { id: 'gas', name: 'Gas Natural', category: 'utilities', requiresAccountNumber: true, minAmount: 50, maxAmount: 50000 },
  
  // Internet/Phone
  { id: 'telmex', name: 'Telmex', category: 'internet', requiresAccountNumber: true, minAmount: 100, maxAmount: 5000 },
  { id: 'izzi', name: 'Izzi', category: 'internet', requiresAccountNumber: true, minAmount: 100, maxAmount: 5000 },
  { id: 'totalplay', name: 'Totalplay', category: 'internet', requiresAccountNumber: true, minAmount: 100, maxAmount: 5000 },
  
  // Transport
  { id: 'metrobus', name: 'Metrobús CDMX', category: 'transport', requiresAccountNumber: true, minAmount: 10, maxAmount: 1000 },
  { id: 'metro', name: 'Metro CDMX', category: 'transport', requiresAccountNumber: true, minAmount: 10, maxAmount: 1000 },
];

const categoryIcons = {
  mobile: MobileIcon,
  utilities: BoltIcon,
  internet: WifiIcon,
  transport: BusIcon,
  other: ShoppingBagIcon,
};

const categoryColors = {
  mobile: 'from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30',
  utilities: 'from-yellow-50 to-yellow-100 dark:from-yellow-900/30 dark:to-yellow-800/30',
  internet: 'from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30',
  transport: 'from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30',
  other: 'from-gray-50 to-gray-100 dark:from-gray-900/30 dark:to-gray-800/30',
};

export function ServicesScreen() {
  const router = useRouter();
  const { mercadoPago, language, addTransaction, addNotification, setMercadoPago } = useApp();
  const [selectedCategory, setSelectedCategory] = useState<ServiceCategory | 'all'>('all');
  const [selectedProvider, setSelectedProvider] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [accountNumber, setAccountNumber] = useState<string>('');
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [step, setStep] = useState<'select' | 'details' | 'confirm' | 'processing' | 'success'>('select');
  const [isProcessing, setIsProcessing] = useState(false);

  const labels = {
    en: {
      title: 'Pay Services',
      subtitle: 'Pay bills and top-up services with Mercado Pago',
      selectService: 'Select Service',
      selectProvider: 'Select Provider',
      amount: 'Amount (MXN)',
      accountNumber: 'Account Number',
      phoneNumber: 'Phone Number',
      continue: 'Continue',
      confirm: 'Confirm Payment',
      processing: 'Processing Payment...',
      success: 'Payment Successful!',
      back: 'Back',
      cancel: 'Cancel',
      balance: 'Mercado Pago Balance',
      insufficientFunds: 'Insufficient funds',
      minAmount: 'Minimum amount',
      maxAmount: 'Maximum amount',
      categories: {
        all: 'All Services',
        mobile: 'Mobile Top-ups',
        utilities: 'Utilities',
        internet: 'Internet & Phone',
        transport: 'Transport',
        other: 'Other',
      },
      errors: {
        selectProvider: 'Please select a provider',
        enterAmount: 'Please enter an amount',
        enterAccountNumber: 'Please enter account number',
        enterPhoneNumber: 'Please enter phone number',
        invalidAmount: 'Invalid amount',
        insufficientFunds: 'Insufficient funds in Mercado Pago',
        minAmount: 'Amount below minimum',
        maxAmount: 'Amount above maximum',
      },
    },
    es: {
      title: 'Pagar Servicios',
      subtitle: 'Paga facturas y recarga servicios con Mercado Pago',
      selectService: 'Seleccionar Servicio',
      selectProvider: 'Seleccionar Proveedor',
      amount: 'Monto (MXN)',
      accountNumber: 'Número de Cuenta',
      phoneNumber: 'Número de Teléfono',
      continue: 'Continuar',
      confirm: 'Confirmar Pago',
      processing: 'Procesando Pago...',
      success: '¡Pago Exitoso!',
      back: 'Atrás',
      cancel: 'Cancelar',
      balance: 'Saldo Mercado Pago',
      insufficientFunds: 'Fondos insuficientes',
      minAmount: 'Monto mínimo',
      maxAmount: 'Monto máximo',
      categories: {
        all: 'Todos los Servicios',
        mobile: 'Recargas Móviles',
        utilities: 'Servicios Públicos',
        internet: 'Internet y Teléfono',
        transport: 'Transporte',
        other: 'Otros',
      },
      errors: {
        selectProvider: 'Por favor selecciona un proveedor',
        enterAmount: 'Por favor ingresa un monto',
        enterAccountNumber: 'Por favor ingresa el número de cuenta',
        enterPhoneNumber: 'Por favor ingresa el número de teléfono',
        invalidAmount: 'Monto inválido',
        insufficientFunds: 'Fondos insuficientes en Mercado Pago',
        minAmount: 'Monto menor al mínimo',
        maxAmount: 'Monto mayor al máximo',
      },
    },
  };

  const t = labels[language];

  // Check if Mercado Pago is connected
  if (!mercadoPago.connected) {
    return (
      <Container>
        <div className="py-8">
          <BackButton />
          <Card padding="lg" className="max-w-md mx-auto text-center">
            <Icon size="xl" color="neon" className="mb-4">
              <CreditCardIcon />
            </Icon>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{t.title}</h1>
            <p className="text-gray-600 dark:text-gray-300 mb-6">{t.subtitle}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              {language === 'en' 
                ? 'Please connect your Mercado Pago account first'
                : 'Por favor conecta tu cuenta de Mercado Pago primero'}
            </p>
            <Button
              variant="primary"
              size="lg"
              fullWidth
              onClick={() => router.push('/connect-mercado')}
            >
              {language === 'en' ? 'Connect Mercado Pago' : 'Conectar Mercado Pago'}
            </Button>
          </Card>
        </div>
      </Container>
    );
  }

  const filteredProviders = selectedCategory === 'all'
    ? serviceProviders
    : serviceProviders.filter(p => p.category === selectedCategory);

  const selectedProviderData = serviceProviders.find(p => p.id === selectedProvider);

  const categories: Array<{ value: ServiceCategory | 'all'; label: string }> = [
    { value: 'all', label: t.categories.all },
    { value: 'mobile', label: t.categories.mobile },
    { value: 'utilities', label: t.categories.utilities },
    { value: 'internet', label: t.categories.internet },
    { value: 'transport', label: t.categories.transport },
  ];

  const handleCategoryChange = (category: ServiceCategory | 'all') => {
    setSelectedCategory(category);
    setSelectedProvider('');
    setStep('select');
  };

  const handleProviderSelect = (providerId: string) => {
    setSelectedProvider(providerId);
    setStep('details');
    setAmount('');
    setAccountNumber('');
    setPhoneNumber('');
  };

  const validateForm = (): string | null => {
    if (!selectedProvider) return t.errors.selectProvider;
    if (!amount) return t.errors.enterAmount;
    
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) return t.errors.invalidAmount;
    
    if (selectedProviderData) {
      if (selectedProviderData.minAmount && amountNum < selectedProviderData.minAmount) {
        return `${t.errors.minAmount}: $${selectedProviderData.minAmount}`;
      }
      if (selectedProviderData.maxAmount && amountNum > selectedProviderData.maxAmount) {
        return `${t.errors.maxAmount}: $${selectedProviderData.maxAmount}`;
      }
    }
    
    if (amountNum > mercadoPago.balance) return t.errors.insufficientFunds;
    
    if (selectedProviderData?.requiresAccountNumber && !accountNumber) {
      return t.errors.enterAccountNumber;
    }
    
    if (selectedProviderData?.requiresPhoneNumber && !phoneNumber) {
      return t.errors.enterPhoneNumber;
    }
    
    return null;
  };

  const handleContinue = () => {
    const error = validateForm();
    if (error) {
      addNotification({
        type: 'system',
        title: language === 'en' ? 'Validation Error' : 'Error de Validación',
        message: error,
      });
      return;
    }
    setStep('confirm');
  };

  const handleConfirm = async () => {
    setIsProcessing(true);
    setStep('processing');
    
    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const amountNum = parseFloat(amount);
    
    // Update Mercado Pago balance
    setMercadoPago({
      ...mercadoPago,
      balance: mercadoPago.balance - amountNum,
    });
    
    // Add transaction
    addTransaction({
      id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'service',
      status: 'completed',
      fromToken: 'MXN',
      toToken: 'MXN',
      fromAmount: amountNum,
      toAmount: amountNum,
      timestamp: Date.now(),
      description: `${selectedProviderData?.name} - ${selectedProviderData?.category === 'mobile' ? phoneNumber : accountNumber}`,
    });
    
    // Add notification
    addNotification({
      type: 'transaction',
      title: language === 'en' ? 'Payment Successful' : 'Pago Exitoso',
      message: language === 'en' 
        ? `Successfully paid $${amountNum.toFixed(2)} to ${selectedProviderData?.name}`
        : `Pago exitoso de $${amountNum.toFixed(2)} a ${selectedProviderData?.name}`,
    });
    
    setStep('success');
    setIsProcessing(false);
  };

  const handleReset = () => {
    setStep('select');
    setSelectedProvider('');
    setAmount('');
    setAccountNumber('');
    setPhoneNumber('');
  };

  return (
    <Container>
      <div className="py-8">
        <BackButton />
        
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{t.title}</h1>
          <p className="text-gray-600 dark:text-gray-300">{t.subtitle}</p>
        </div>

        {/* Balance Card */}
        <Card padding="lg" className="mb-6 bg-gradient-to-br from-acid-lemon/10 via-acid-lemon/5 to-transparent">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{t.balance}</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white financial-number">
                ${mercadoPago.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MXN
              </p>
            </div>
            <Icon size="xl" color="neon">
              <CreditCardIcon />
            </Icon>
          </div>
        </Card>

        {/* Category Filter */}
        {step === 'select' && (
          <div className="mb-6">
            <Select
              label={t.selectService}
              options={categories}
              value={selectedCategory}
              onChange={(value) => handleCategoryChange(value as ServiceCategory | 'all')}
            />
          </div>
        )}

        {/* Step 1: Select Provider */}
        {step === 'select' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredProviders.map((provider) => {
              const IconComponent = categoryIcons[provider.category];
              const colorClass = categoryColors[provider.category];
              
              return (
                <Card
                  key={provider.id}
                  variant="interactive"
                  padding="lg"
                  onClick={() => handleProviderSelect(provider.id)}
                  className="group"
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-3 bg-gradient-to-br ${colorClass} rounded-xl group-hover:scale-110 transition-transform duration-200`}>
                      <Icon size="lg" color="info">
                        <IconComponent />
                      </Icon>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900 dark:text-white mb-1">{provider.name}</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{provider.category}</p>
                      {provider.minAmount && provider.maxAmount && (
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                          ${provider.minAmount} - ${provider.maxAmount} MXN
                        </p>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* Step 2: Enter Details */}
        {step === 'details' && selectedProviderData && (
          <Card padding="lg" className="max-w-md mx-auto">
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-4">
                <div className={`p-2 bg-gradient-to-br ${categoryColors[selectedProviderData.category]} rounded-lg`}>
                  <Icon size="md" color="info">
                    {React.createElement(categoryIcons[selectedProviderData.category])}
                  </Icon>
                </div>
                <div>
                  <h2 className="font-bold text-lg text-gray-900 dark:text-white">{selectedProviderData.name}</h2>
                  <Badge variant="info" size="sm">{selectedProviderData.category}</Badge>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {selectedProviderData.requiresPhoneNumber && (
                <Input
                  label={t.phoneNumber}
                  type="tel"
                  placeholder="10 digit phone number"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                />
              )}

              {selectedProviderData.requiresAccountNumber && (
                <Input
                  label={t.accountNumber}
                  type="text"
                  placeholder="Account number"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                />
              )}

              <Input
                label={t.amount}
                type="number"
                placeholder={`${selectedProviderData.minAmount || 10} - ${selectedProviderData.maxAmount || 10000} MXN`}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                helperText={
                  selectedProviderData.minAmount && selectedProviderData.maxAmount
                    ? `${t.minAmount}: $${selectedProviderData.minAmount}, ${t.maxAmount}: $${selectedProviderData.maxAmount}`
                    : undefined
                }
              />

              <div className="flex gap-3 pt-2">
                <Button
                  variant="ghost"
                  size="lg"
                  fullWidth
                  onClick={() => setStep('select')}
                >
                  {t.back}
                </Button>
                <Button
                  variant="primary"
                  size="lg"
                  fullWidth
                  onClick={handleContinue}
                >
                  {t.continue}
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Step 3: Confirm */}
        {step === 'confirm' && selectedProviderData && (
          <Card padding="lg" className="max-w-md mx-auto">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">{t.confirm}</h2>
            
            <div className="space-y-4 mb-6">
              <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                <span className="text-gray-600 dark:text-gray-400">{t.selectProvider}</span>
                <span className="font-semibold text-gray-900 dark:text-white">{selectedProviderData.name}</span>
              </div>
              
              {selectedProviderData.requiresPhoneNumber && phoneNumber && (
                <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                  <span className="text-gray-600 dark:text-gray-400">{t.phoneNumber}</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{phoneNumber}</span>
                </div>
              )}
              
              {selectedProviderData.requiresAccountNumber && accountNumber && (
                <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                  <span className="text-gray-600 dark:text-gray-400">{t.accountNumber}</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{accountNumber}</span>
                </div>
              )}
              
              <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                <span className="text-gray-600 dark:text-gray-400">{t.amount}</span>
                <span className="font-bold text-xl text-gray-900 dark:text-white financial-number">
                  ${parseFloat(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MXN
                </span>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="ghost"
                size="lg"
                fullWidth
                onClick={() => setStep('details')}
              >
                {t.back}
              </Button>
              <Button
                variant="primary"
                size="lg"
                fullWidth
                onClick={handleConfirm}
                loading={isProcessing}
              >
                {t.confirm}
              </Button>
            </div>
          </Card>
        )}

        {/* Step 4: Processing */}
        {step === 'processing' && (
          <Card padding="lg" className="max-w-md mx-auto text-center">
            <div className="py-8">
              <div className="animate-spin mx-auto mb-4 w-12 h-12 border-4 border-acid-lemon border-t-transparent rounded-full"></div>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">{t.processing}</p>
            </div>
          </Card>
        )}

        {/* Step 5: Success */}
        {step === 'success' && selectedProviderData && (
          <Card padding="lg" className="max-w-md mx-auto text-center">
            <Icon size="xl" color="success" className="mb-4">
              <CheckCircleIcon />
            </Icon>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{t.success}</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              {language === 'en'
                ? `Payment of $${parseFloat(amount).toFixed(2)} to ${selectedProviderData.name} has been processed successfully.`
                : `El pago de $${parseFloat(amount).toFixed(2)} a ${selectedProviderData.name} se ha procesado exitosamente.`}
            </p>
            <div className="flex gap-3">
              <Button
                variant="ghost"
                size="lg"
                fullWidth
                onClick={() => router.push('/')}
              >
                {language === 'en' ? 'Go Home' : 'Ir al Inicio'}
              </Button>
              <Button
                variant="primary"
                size="lg"
                fullWidth
                onClick={handleReset}
              >
                {language === 'en' ? 'Pay Another Service' : 'Pagar Otro Servicio'}
              </Button>
            </div>
          </Card>
        )}
      </div>
    </Container>
  );
}

