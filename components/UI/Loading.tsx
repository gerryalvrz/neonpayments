'use client';

import React from 'react';
import { cn } from '@/utils/cn';

export function Spinner({ className, size = 'md' }: { className?: string; size?: 'sm' | 'md' | 'lg' }) {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  return (
    <div
      className={cn(
        'animate-spin rounded-full border-2 border-acid-lemon border-t-transparent',
        sizes[size],
        className
      )}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
}

export function Skeleton({
  className,
  lines = 1,
}: {
  className?: string;
  lines?: number;
}) {
  if (lines === 1) {
    return (
      <div
        className={cn(
          'animate-pulse rounded-lg bg-gray-200',
          className || 'h-4 w-full'
        )}
      />
    );
  }

  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'animate-pulse rounded-lg bg-gray-200',
            className || 'h-4 w-full',
            i === lines - 1 && 'w-3/4'
          )}
        />
      ))}
    </div>
  );
}

export function Progress({
  value,
  max = 100,
  className,
}: {
  value: number;
  max?: number;
  className?: string;
}) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  return (
    <div
      className={cn(
        'w-full h-2 bg-gray-200 rounded-full overflow-hidden',
        className
      )}
    >
      <div
        className="h-full bg-acid-lemon transition-all duration-300 ease-out"
        style={{ width: `${percentage}%` }}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
      />
    </div>
  );
}
