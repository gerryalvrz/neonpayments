'use client';

import React from 'react';
import { cn } from '@/utils/cn';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  fullWidth?: boolean;
  children: React.ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  className,
  disabled,
  children,
  ...props
}: ButtonProps) {
  const baseStyles = 'inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:transform-none';
  
  const variants = {
    primary: 'bg-acid-lemon text-gray-900 dark:text-gray-900 hover:bg-acid-lemon-light hover:shadow-acid-lg hover:-translate-y-0.5 focus:ring-acid-lemon active:translate-y-0 active:bg-acid-lemon-dark',
    secondary: 'bg-glass-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-acid-lemon/30 dark:border-acid-lemon/40 hover:bg-acid-lemon/10 dark:hover:bg-acid-lemon/20 hover:border-acid-lemon/50 dark:hover:border-acid-lemon/60 hover:shadow-acid focus:ring-acid-lemon active:bg-acid-lemon/5 dark:active:bg-acid-lemon/10',
    outline: 'bg-transparent text-gray-700 dark:text-gray-200 border-2 border-gray-300 dark:border-gray-600 hover:border-acid-lemon dark:hover:border-acid-lemon hover:text-acid-lemon-dark dark:hover:text-acid-lemon focus:ring-acid-lemon active:bg-acid-lemon/5 dark:active:bg-acid-lemon/10',
    ghost: 'bg-transparent text-gray-700 dark:text-gray-200 hover:bg-acid-lemon/10 dark:hover:bg-acid-lemon/20 hover:text-acid-lemon-dark dark:hover:text-acid-lemon focus:ring-acid-lemon active:bg-acid-lemon/5 dark:active:bg-acid-lemon/10',
    danger: 'bg-semantic-error text-white hover:bg-red-600 hover:shadow-lg hover:-translate-y-0.5 focus:ring-red-500 active:translate-y-0',
  };
  
  const sizes = {
    sm: 'px-4 py-2 text-sm gap-2',
    md: 'px-5 py-2.5 text-base gap-2',
    lg: 'px-6 py-3 text-lg gap-2.5',
  };

  return (
    <button
      className={cn(
        baseStyles,
        variants[variant],
        sizes[size],
        fullWidth && 'w-full',
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          {children}
        </span>
      ) : (
        children
      )}
    </button>
  );
}
