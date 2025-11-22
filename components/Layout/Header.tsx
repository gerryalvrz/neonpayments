'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Card } from '@/components/UI/Card';
import { Badge } from '@/components/UI/Badge';
import { Icon, CopyIcon, CheckIcon, LanguageIcon } from '@/components/Icons';
import { Button } from '@/components/UI/Button';

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
    <Card variant="elevated" padding="md" className="mb-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h2 className="text-lg font-semibold text-gray-900">
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
              <code className="text-xs font-mono text-gray-600 bg-gray-100 px-2 py-1 rounded">
                {user.walletAddress.slice(0, 6)}...{user.walletAddress.slice(-4)}
              </code>
              <button
                onClick={handleCopy}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
                aria-label="Copy address"
              >
                <Icon color={copied ? 'success' : 'gray'}>
                  {copied ? <CheckIcon /> : <CopyIcon />}
                </Icon>
              </button>
            </div>
          )}
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-xs text-gray-500 mb-1">Balance</div>
            <div className="text-sm font-semibold text-gray-900">
              {walletBalance.USDC.toFixed(2)} USDC
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleLanguage}
            aria-label="Toggle language"
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
