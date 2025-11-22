'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Card } from '@/components/UI/Card';
import { Badge } from '@/components/UI/Badge';
import { Icon, CopyIcon, CheckIcon, LanguageIcon } from '@/components/Icons';
import { Button } from '@/components/UI/Button';
import { ThemeToggle } from '@/components/UI/ThemeToggle';

export function Header() {
  const { user, walletBalance, language, setLanguage } = useApp();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (user?.walletAddress) {
      await navigator.clipboard.writeText(user.walletAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'es' : 'en');
  };

  if (!user) return null;

  return (
    <Card variant="elevated" padding="lg" className="mb-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              {user.email || user.phone || 'User'}
            </h2>
            {user.selfVerified && (
              <Badge variant="success" size="sm">
                Verified
              </Badge>
            )}
          </div>
          {user.walletAddress && (
            <div className="flex items-center gap-2">
              <code className="text-xs font-mono text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-3 py-1.5 rounded-lg">
                {user.walletAddress.slice(0, 6)}...{user.walletAddress.slice(-4)}
              </code>
              <button
                onClick={handleCopy}
                className="p-2 hover:bg-acid-lemon/10 rounded-lg transition-colors group"
                aria-label="Copy address"
              >
                <Icon color={copied ? 'success' : 'gray'} className="group-hover:text-acid-lemon-dark">
                  {copied ? <CheckIcon /> : <CopyIcon />}
                </Icon>
              </button>
            </div>
          )}
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide">Quick Balance</div>
            <div className="text-lg font-bold text-gray-900 dark:text-gray-100 financial-number">
              {walletBalance.USDC.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">USDC</span>
            </div>
          </div>
          <ThemeToggle size="sm" />
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleLanguage}
            aria-label="Toggle language"
            className="border border-gray-200 dark:border-gray-700 hover:border-acid-lemon/30 dark:hover:border-acid-lemon/50"
          >
            <Icon>
              <LanguageIcon />
            </Icon>
            {language.toUpperCase()}
          </Button>
        </div>
      </div>
    </Card>
  );
}
