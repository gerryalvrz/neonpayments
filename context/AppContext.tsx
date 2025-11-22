'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import type { User, MercadoPagoAccount, WalletBalance, SelfVerification, Language } from '@/types';

interface AppContextType {
  user: User | null;
  mercadoPago: MercadoPagoAccount;
  walletBalance: WalletBalance;
  selfVerification: SelfVerification;
  language: Language;
  
  setUser: (user: User | null) => void;
  setMercadoPago: (account: MercadoPagoAccount) => void;
  setWalletBalance: (balance: WalletBalance) => void;
  setSelfVerification: (verification: SelfVerification) => void;
  setLanguage: (language: Language) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [mercadoPago, setMercadoPago] = useState<MercadoPagoAccount>({
    connected: false,
    balance: 0,
  });
  const [walletBalance, setWalletBalance] = useState<WalletBalance>({
    cUSD: 0,
    USDC: 0,
    cREAL: 0,
  });
  const [selfVerification, setSelfVerification] = useState<SelfVerification>({
    verified: false,
  });
  const [language, setLanguage] = useState<Language>('en');

  return (
    <AppContext.Provider
      value={{
        user,
        mercadoPago,
        walletBalance,
        selfVerification,
        language,
        setUser,
        setMercadoPago,
        setWalletBalance,
        setSelfVerification,
        setLanguage,
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


