'use client';

import React from 'react';
import { cn } from '@/utils/cn';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'error' | 'warning' | 'info' | 'neon';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export function Badge({
  variant = 'default',
  size = 'md',
  className,
  children,
  ...props
}: BadgeProps) {
  const baseStyles = 'inline-flex items-center font-medium rounded-full';
  
  const variants = {
    default: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700',
    success: 'bg-semantic-success-light dark:bg-semantic-success/20 text-semantic-success dark:text-green-400 border border-semantic-success/30 dark:border-semantic-success/40 font-semibold',
    error: 'bg-semantic-error-light dark:bg-semantic-error/20 text-semantic-error dark:text-red-400 border border-semantic-error/30 dark:border-semantic-error/40 font-semibold',
    warning: 'bg-semantic-warning-light dark:bg-semantic-warning/20 text-semantic-warning dark:text-yellow-400 border border-semantic-warning/30 dark:border-semantic-warning/40 font-semibold',
    info: 'bg-semantic-info-light dark:bg-semantic-info/20 text-semantic-info dark:text-blue-400 border border-semantic-info/30 dark:border-semantic-info/40 font-semibold',
    neon: 'bg-acid-lemon-100 dark:bg-acid-lemon/20 text-acid-lemon-dark dark:text-acid-lemon border border-acid-lemon/40 dark:border-acid-lemon/50 font-semibold',
  };
  
  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base',
  };

  return (
    <span
      className={cn(
        baseStyles,
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
