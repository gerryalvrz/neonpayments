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
    default: 'bg-gray-100 text-gray-800',
    success: 'bg-semantic-success/20 text-semantic-success border border-semantic-success',
    error: 'bg-semantic-error/20 text-semantic-error border border-semantic-error',
    warning: 'bg-semantic-warning/20 text-semantic-warning border border-semantic-warning',
    info: 'bg-semantic-info/20 text-semantic-info border border-semantic-info',
    neon: 'bg-acid-lemon/20 text-acid-lemon-dark border border-acid-lemon',
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
