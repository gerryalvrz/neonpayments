'use client';

import React from 'react';
import { cn } from '@/utils/cn';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'interactive';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export function Card({
  variant = 'default',
  padding = 'md',
  className,
  children,
  ...props
}: CardProps) {
  const baseStyles = 'rounded-xl backdrop-blur-[20px] border-2 border-acid-lemon';
  
  const variants = {
    default: 'bg-glass-white shadow-acid',
    elevated: 'bg-glass-white shadow-lg',
    interactive: 'bg-glass-white shadow-acid hover:shadow-neon transition-shadow cursor-pointer',
  };
  
  const paddings = {
    none: '',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
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
