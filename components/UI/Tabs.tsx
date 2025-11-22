'use client';

import React from 'react';
import { cn } from '@/utils/cn';

interface TabsProps {
  tabs: { id: string; label: string; disabled?: boolean }[];
  activeTab: string;
  onChange: (tabId: string) => void;
  className?: string;
}

export function Tabs({ tabs, activeTab, onChange, className }: TabsProps) {
  return (
    <div className={cn('flex gap-1 border-b border-gray-200', className)}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => !tab.disabled && onChange(tab.id)}
          disabled={tab.disabled}
          className={cn(
            'px-5 py-3 font-semibold text-sm transition-all duration-200 relative',
            'hover:text-gray-900',
            tab.disabled && 'opacity-50 cursor-not-allowed',
            activeTab === tab.id
              ? 'text-gray-900'
              : 'text-gray-500'
          )}
        >
          {tab.label}
          {activeTab === tab.id && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-acid-lemon rounded-full" />
          )}
        </button>
      ))}
    </div>
  );
}

