'use client';

import React, { useEffect } from 'react';
import { cn } from '@/utils/cn';
import { Icon, XIcon } from '@/components/Icons';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  showCloseButton?: boolean;
  className?: string;
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  showCloseButton = true,
  className,
}: ModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', onKey);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-full mx-4',
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      <button
        type="button"
        aria-label="Close dialog"
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in border-0 cursor-default"
        onClick={onClose}
      />
      <div
        className={cn(
          'relative z-[201] bg-white dark:bg-gray-900 rounded-xl border-2 border-acid-lemon shadow-neon',
          'max-h-[90vh] overflow-y-auto',
          sizes[size],
          'w-full',
          'animate-slide-up',
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between p-6 border-b-2 border-acid-lemon/30">
            {title && (
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h2>
            )}
            {showCloseButton && (
              <button
                type="button"
                onClick={onClose}
                className="p-2 hover:bg-acid-lemon/20 rounded-lg transition-colors"
                aria-label="Close modal"
              >
                <Icon color="gray" size="md">
                  <XIcon />
                </Icon>
              </button>
            )}
          </div>
        )}
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
