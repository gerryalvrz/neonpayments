'use client';

import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import { useWallet } from '@/utils/wallet/useWallet';
import type { 
  User, 
  MercadoPagoAccount, 
  WalletBalance, 
  SelfVerification, 
  Language,
  Transaction,
  Notification,
  UserSettings
} from '@/types';

type Theme = 'light' | 'dark';

interface AppContextType {
  user: User | null;
  mercadoPago: MercadoPagoAccount;
  walletBalance: WalletBalance;
  selfVerification: SelfVerification;
  language: Language;
  theme: Theme;
  transactions: Transaction[];
  notifications: Notification[];
  settings: UserSettings;
  
  // Wallet integration
  wallet: {
    isConnected: boolean;
    address: string | null;
    isConnecting: boolean;
    error: string | null;
    isMiniPay: boolean;
    connect: () => Promise<void>;
    disconnect: () => Promise<void>;
  };
  
  setUser: (user: User | null) => void;
  setMercadoPago: (account: MercadoPagoAccount) => void;
  setWalletBalance: (balance: WalletBalance) => void;
  setSelfVerification: (verification: SelfVerification) => void;
  setLanguage: (language: Language) => void;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  addTransaction: (transaction: Transaction) => void;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markNotificationRead: (id: string) => void;
  updateSettings: (settings: Partial<UserSettings>) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  // Wallet integration
  const walletHook = useWallet();
  
  const [user, setUser] = useState<User | null>(null);
  const [mercadoPago, setMercadoPago] = useState<MercadoPagoAccount>({
    connected: false,
    balance: 0,
  });
  const [walletBalance, setWalletBalance] = useState<WalletBalance>({
    cUSD: 0,
    USDC: 0,
    USDT: 0,
  });
  const [selfVerification, setSelfVerification] = useState<SelfVerification>({
    verified: false,
  });
  const [language, setLanguage] = useState<Language>('en');
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme') as Theme;
      if (savedTheme === 'dark' || savedTheme === 'light') {
        return savedTheme;
      }
      // Check system preference
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
      }
    }
    return 'light';
  });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [settings, setSettings] = useState<UserSettings>({
    currency: 'MXN',
    language: 'en',
    notifications: {
      email: true,
      push: true,
      transaction: true,
      security: true,
    },
    security: {
      twoFactorEnabled: false,
      biometricEnabled: false,
    },
  });

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState(prev => prev === 'light' ? 'dark' : 'light');
  }, []);

  // Sync wallet address with user when wallet connects
  useEffect(() => {
    if (walletHook.isConnected && walletHook.address) {
      // Update user with wallet address if not already set
      setUser(prev => {
        if (prev && prev.walletAddress !== walletHook.address) {
          return {
            ...prev,
            walletAddress: walletHook.address || undefined,
          };
        }
        // If no user exists but wallet is connected, create minimal user
        if (!prev && walletHook.address) {
          return {
            id: walletHook.address,
            walletAddress: walletHook.address,
            isVerified: true,
            selfVerified: false,
          };
        }
        return prev;
      });
    }
  }, [walletHook.isConnected, walletHook.address]);

  const addTransaction = useCallback((transaction: Transaction) => {
    setTransactions(prev => [transaction, ...prev]);
  }, []);

  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      read: false,
    };
    setNotifications(prev => [newNotification, ...prev]);
  }, []);

  const markNotificationRead = useCallback((id: string) => {
    setNotifications(prev =>
      prev.map(notif => (notif.id === id ? { ...notif, read: true } : notif))
    );
  }, []);

  const updateSettings = useCallback((newSettings: Partial<UserSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  return (
    <AppContext.Provider
      value={{
        user,
        mercadoPago,
        walletBalance,
        selfVerification,
        language,
        theme,
        transactions,
        notifications,
        settings,
        wallet: {
          isConnected: walletHook.isConnected,
          address: walletHook.address,
          isConnecting: walletHook.isConnecting,
          error: walletHook.error,
          isMiniPay: walletHook.isMiniPay,
          connect: walletHook.connect,
          disconnect: walletHook.disconnect,
        },
        setUser,
        setMercadoPago,
        setWalletBalance,
        setSelfVerification,
        setLanguage,
        setTheme,
        toggleTheme,
        addTransaction,
        addNotification,
        markNotificationRead,
        updateSettings,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}


