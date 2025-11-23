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
import { Tabs } from '@/components/UI/Tabs';
import { Icon, SettingsIcon, UserIcon, BellIcon, ShieldIcon, CreditCardIcon, LanguageIcon } from '@/components/Icons';
import { ThemeToggle } from '@/components/UI/ThemeToggle';

export function SettingsScreen() {
  const router = useRouter();
  const { user, mercadoPago, settings, updateSettings, setLanguage, language } = useApp();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'notifications' | 'preferences'>('profile');

  const labels = {
    en: {
      title: 'Settings',
      profile: 'Profile',
      security: 'Security',
      notifications: 'Notifications',
      preferences: 'Preferences',
      email: 'Email',
      phone: 'Phone',
      walletAddress: 'Wallet Address',
      verification: 'Verification Status',
      verified: 'Verified',
      notVerified: 'Not Verified',
      connectedAccounts: 'Connected Accounts',
      mercadoPago: 'Mercado Pago',
      connected: 'Connected',
      notConnected: 'Not Connected',
      disconnect: 'Disconnect',
      connect: 'Connect',
      balance: 'Balance',
      currency: 'Currency',
      language: 'Language',
      english: 'English',
      spanish: 'Spanish',
      notificationSettings: 'Notification Settings',
      emailNotifications: 'Email Notifications',
      pushNotifications: 'Push Notifications',
      transactionNotifications: 'Transaction Notifications',
      securityNotifications: 'Security Notifications',
      securitySettings: 'Security Settings',
      twoFactorAuth: 'Two-Factor Authentication',
      biometricAuth: 'Biometric Authentication',
      enabled: 'Enabled',
      disabled: 'Disabled',
      enable: 'Enable',
      disable: 'Disable',
      save: 'Save Changes',
      saved: 'Settings saved successfully!',
      logout: 'Logout',
      logoutConfirm: 'Are you sure you want to logout?',
    },
    es: {
      title: 'Configuración',
      profile: 'Perfil',
      security: 'Seguridad',
      notifications: 'Notificaciones',
      preferences: 'Preferencias',
      email: 'Correo',
      phone: 'Teléfono',
      walletAddress: 'Dirección de Billetera',
      verification: 'Estado de Verificación',
      verified: 'Verificado',
      notVerified: 'No Verificado',
      connectedAccounts: 'Cuentas Conectadas',
      mercadoPago: 'Mercado Pago',
      connected: 'Conectado',
      notConnected: 'No Conectado',
      disconnect: 'Desconectar',
      connect: 'Conectar',
      balance: 'Saldo',
      currency: 'Moneda',
      language: 'Idioma',
      english: 'Inglés',
      spanish: 'Español',
      notificationSettings: 'Configuración de Notificaciones',
      emailNotifications: 'Notificaciones por Correo',
      pushNotifications: 'Notificaciones Push',
      transactionNotifications: 'Notificaciones de Transacciones',
      securityNotifications: 'Notificaciones de Seguridad',
      securitySettings: 'Configuración de Seguridad',
      twoFactorAuth: 'Autenticación de Dos Factores',
      biometricAuth: 'Autenticación Biométrica',
      enabled: 'Habilitado',
      disabled: 'Deshabilitado',
      enable: 'Habilitar',
      disable: 'Deshabilitar',
      save: 'Guardar Cambios',
      saved: '¡Configuración guardada exitosamente!',
      logout: 'Cerrar Sesión',
      logoutConfirm: '¿Estás seguro de que quieres cerrar sesión?',
    },
  };

  const t = labels[language];

  const tabs = [
    { id: 'profile', label: t.profile },
    { id: 'security', label: t.security },
    { id: 'notifications', label: t.notifications },
    { id: 'preferences', label: t.preferences },
  ];

  const handleSave = () => {
    showToast({
      type: 'success',
      message: t.saved,
    });
  };

  const handleLanguageChange = (lang: 'en' | 'es') => {
    setLanguage(lang);
    updateSettings({ language: lang });
  };

  const handleLogout = () => {
    if (window.confirm(t.logoutConfirm)) {
      // In real app, this would clear auth state
      router.push('/auth');
    }
  };

  const toggleNotification = (key: keyof typeof settings.notifications) => {
    updateSettings({
      notifications: {
        ...settings.notifications,
        [key]: !settings.notifications[key],
      },
    });
  };

  const toggleSecurity = (key: keyof typeof settings.security) => {
    updateSettings({
      security: {
        ...settings.security,
        [key]: !settings.security[key],
      },
    });
  };

  return (
    <Container>
      <div className="py-8">
        <BackButton />
        
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{t.title}</h1>
        </div>

        <Tabs
          tabs={tabs}
          activeTab={activeTab}
          onChange={(tab) => setActiveTab(tab as typeof activeTab)}
          className="mb-6"
        />

        <div className="space-y-4">
          {activeTab === 'profile' && (
            <div className="space-y-4">
              <Card padding="lg">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-acid-lemon rounded-full">
                    <Icon color="gray" size="lg">
                      <UserIcon />
                    </Icon>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">{t.profile}</h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{user?.email || user?.phone || 'User'}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {user?.email && (
                    <Input
                      label={t.email}
                      value={user.email}
                      readOnly
                      className="bg-gray-50 dark:bg-gray-800/50"
                    />
                  )}
                  {user?.phone && (
                    <Input
                      label={t.phone}
                      value={user.phone}
                      readOnly
                      className="bg-gray-50 dark:bg-gray-800/50"
                    />
                  )}
                  {user?.walletAddress && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        {t.walletAddress}
                      </label>
                      <code className="block text-xs font-mono text-gray-900 dark:text-gray-100 bg-gray-100 dark:bg-gray-800 px-3 py-2 rounded-lg break-all">
                        {user.walletAddress}
                      </code>
                    </div>
                  )}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        {t.verification}
                      </label>
                    <Badge variant={user?.selfVerified ? 'success' : 'warning'} size="md">
                      {user?.selfVerified ? t.verified : t.notVerified}
                    </Badge>
                  </div>
                </div>
              </Card>

              <Card padding="lg">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">{t.connectedAccounts}</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Icon color="neon" size="md">
                        <CreditCardIcon />
                      </Icon>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">{t.mercadoPago}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {mercadoPago.connected ? t.connected : t.notConnected}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {mercadoPago.connected && (
                        <div className="text-right">
                          <p className="text-sm text-gray-600 dark:text-gray-400">{t.balance}</p>
                          <p className="font-semibold text-gray-900 dark:text-gray-100">
                            ${mercadoPago.balance.toFixed(2)} MXN
                          </p>
                        </div>
                      )}
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => router.push('/mercado-pago')}
                      >
                        {language === 'en' ? 'Open Mercado Pago' : 'Abrir Mercado Pago'}
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {activeTab === 'security' && (
            <Card padding="lg">
              <div className="flex items-center gap-3 mb-6">
                <Icon color="neon" size="lg">
                  <ShieldIcon />
                </Icon>
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">{t.securitySettings}</h2>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">{t.twoFactorAuth}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {settings.security.twoFactorEnabled ? t.enabled : t.disabled}
                    </p>
                  </div>
                  <Button
                    variant={settings.security.twoFactorEnabled ? 'secondary' : 'primary'}
                    size="sm"
                    onClick={() => toggleSecurity('twoFactorEnabled')}
                  >
                    {settings.security.twoFactorEnabled ? t.disable : t.enable}
                  </Button>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">{t.biometricAuth}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {settings.security.biometricEnabled ? t.enabled : t.disabled}
                    </p>
                  </div>
                  <Button
                    variant={settings.security.biometricEnabled ? 'secondary' : 'primary'}
                    size="sm"
                    onClick={() => toggleSecurity('biometricEnabled')}
                  >
                    {settings.security.biometricEnabled ? t.disable : t.enable}
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {activeTab === 'notifications' && (
            <Card padding="lg">
              <div className="flex items-center gap-3 mb-6">
                <Icon color="neon" size="lg">
                  <BellIcon />
                </Icon>
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">{t.notificationSettings}</h2>
              </div>

              <div className="space-y-4">
                {Object.entries(settings.notifications).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        {t[`${key}Notifications` as keyof typeof t] || key}
                      </p>
                    </div>
                    <Button
                      variant={value ? 'secondary' : 'primary'}
                      size="sm"
                      onClick={() => toggleNotification(key as keyof typeof settings.notifications)}
                    >
                      {value ? t.disable : t.enable}
                    </Button>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {activeTab === 'preferences' && (
            <Card padding="lg">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Theme
                  </label>
                  <ThemeToggle variant="button" size="md" className="w-full justify-center" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t.language}
                  </label>
                  <div className="flex gap-2">
                    <Button
                      variant={language === 'en' ? 'primary' : 'secondary'}
                      size="md"
                      onClick={() => handleLanguageChange('en')}
                      className="flex-1"
                    >
                      <Icon>
                        <LanguageIcon />
                      </Icon>
                      {t.english}
                    </Button>
                    <Button
                      variant={language === 'es' ? 'primary' : 'secondary'}
                      size="md"
                      onClick={() => handleLanguageChange('es')}
                      className="flex-1"
                    >
                      <Icon>
                        <LanguageIcon />
                      </Icon>
                      {t.spanish}
                    </Button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t.currency}
                  </label>
                  <Select
                    options={[
                      { value: 'MXN', label: 'MXN - Mexican Peso' },
                      { value: 'USD', label: 'USD - US Dollar' },
                    ]}
                    value={settings.currency}
                    onChange={(value) => updateSettings({ currency: value as 'MXN' | 'USD' })}
                  />
                </div>

                <Button
                  variant="primary"
                  size="lg"
                  fullWidth
                  onClick={handleSave}
                >
                  {t.save}
                </Button>
              </div>
            </Card>
          )}

          <Card padding="lg" className="border-2 border-red-200">
            <Button
              variant="danger"
              size="lg"
              fullWidth
              onClick={handleLogout}
            >
              {t.logout}
            </Button>
          </Card>
        </div>
      </div>
    </Container>
  );
}
