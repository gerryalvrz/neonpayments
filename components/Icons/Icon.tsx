'use client';

import React from 'react';
import { cn } from '@/utils/cn';

interface IconProps {
  children: React.ReactNode;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number;
  color?: 'neon' | 'gray' | 'white' | 'current' | 'error' | 'success' | 'warning' | 'info';
  className?: string;
}

export function Icon({ children, size = 'md', color = 'current', className }: IconProps) {
  const sizeClasses = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
    xl: 'w-8 h-8',
  };

  const colorClasses = {
    neon: 'text-acid-lemon',
    gray: 'text-gray-400',
    white: 'text-white',
    current: 'text-current',
    error: 'text-semantic-error',
    success: 'text-semantic-success',
    warning: 'text-semantic-warning',
    info: 'text-semantic-info',
  };

  const sizeStyle = typeof size === 'number' ? { width: size, height: size } : undefined;

  return (
    <span
      className={cn(
        typeof size === 'string' && sizeClasses[size],
        colorClasses[color],
        className
      )}
      style={sizeStyle}
    >
      {children}
    </span>
  );
}
