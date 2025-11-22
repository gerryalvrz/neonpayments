'use client';

import React from 'react';
import { cn } from '@/utils/cn';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'interactive' | 'premium';
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  children: React.ReactNode;
}

export function Card({
  variant = 'default',
  padding = 'md',
  className,
  children,
  ...props
}: CardProps) {
  const baseStyles = 'rounded-2xl backdrop-blur-[24px] transition-all duration-300';
  
  const variants = {
    default: 'bg-glass-white dark:bg-gray-800/85 border border-acid-lemon/20 dark:border-acid-lemon/30 shadow-acid dark:shadow-acid-lg',
    elevated: 'bg-glass-white-elevated dark:bg-gray-800/90 border border-acid-lemon/25 dark:border-acid-lemon/35 shadow-acid-lg dark:shadow-acid-xl',
    interactive: 'bg-glass-white dark:bg-gray-800/85 border border-acid-lemon/20 dark:border-acid-lemon/30 shadow-acid dark:shadow-acid-lg hover:shadow-acid-lg dark:hover:shadow-acid-xl hover:border-acid-lemon/30 dark:hover:border-acid-lemon/40 hover:-translate-y-0.5 cursor-pointer active:translate-y-0',
    premium: 'bg-gradient-to-br from-glass-white to-glass-white-elevated dark:from-gray-800/90 dark:to-gray-800/95 border border-acid-lemon/30 dark:border-acid-lemon/40 shadow-acid-xl dark:shadow-acid-xl',
  };
  
  const paddings = {
    none: '',
    sm: 'p-4',
    md: 'p-5',
    lg: 'p-6',
    xl: 'p-8',
  };

  return (
    <div
      className={cn(
        baseStyles,
        variants[variant],
        paddings[padding],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
