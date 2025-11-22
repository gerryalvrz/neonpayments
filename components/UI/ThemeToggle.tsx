'use client';

import React from 'react';
import { useApp } from '@/context/AppContext';
import { Icon, SunIcon, MoonIcon } from '@/components/Icons';
import { cn } from '@/utils/cn';

interface ThemeToggleProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'button' | 'icon';
}

export function ThemeToggle({ className, size = 'md', variant = 'icon' }: ThemeToggleProps) {
  const { theme, toggleTheme } = useApp();

  const sizes = {
    sm: 'p-2',
    md: 'p-2.5',
    lg: 'p-3',
  };

  const iconSizes = {
    sm: 'text-base',
    md: 'text-lg',
    lg: 'text-xl',
  };

  if (variant === 'button') {
    return (
      <button
        onClick={toggleTheme}
        className={cn(
          'inline-flex items-center justify-center gap-2 rounded-xl transition-all duration-200',
          'bg-glass-white dark:bg-gray-800',
          'border border-gray-200 dark:border-acid-lemon/30',
          'text-gray-700 dark:text-gray-200',
          'hover:bg-acid-lemon/10 dark:hover:bg-acid-lemon/20',
          'hover:border-acid-lemon/50 dark:hover:border-acid-lemon/50',
          'focus:outline-none focus:ring-2 focus:ring-acid-lemon focus:ring-offset-2',
          'focus:ring-offset-white dark:focus:ring-offset-gray-900',
          sizes[size],
          className
        )}
        aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
      >
        <Icon className={iconSizes[size]}>
          {theme === 'light' ? <MoonIcon /> : <SunIcon />}
        </Icon>
        <span className="text-sm font-medium">
          {theme === 'light' ? 'Dark' : 'Light'}
        </span>
      </button>
    );
  }

  return (
    <button
      onClick={toggleTheme}
      className={cn(
        'inline-flex items-center justify-center rounded-lg transition-all duration-200',
        'bg-transparent text-gray-700 dark:text-gray-200',
        'hover:bg-acid-lemon/10 dark:hover:bg-acid-lemon/20',
        'focus:outline-none focus:ring-2 focus:ring-acid-lemon focus:ring-offset-2',
        'focus:ring-offset-white dark:focus:ring-offset-gray-900',
        sizes[size],
        className
      )}
      aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
    >
      <Icon className={cn('transition-transform duration-300', iconSizes[size])}>
        {theme === 'light' ? <MoonIcon /> : <SunIcon />}
      </Icon>
    </button>
  );
}

