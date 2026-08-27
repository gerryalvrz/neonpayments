'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/utils/cn';
import { Icon, XIcon } from '@/components/Icons';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  showCloseButton?: boolean;
  closeOnOverlay?: boolean;
  className?: string;
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  showCloseButton = true,
  closeOnOverlay = true,
  className,
}: ModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && closeOnOverlay) onClose();
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', onKey);
    };
  }, [isOpen, onClose, closeOnOverlay]);

  if (!isOpen || !mounted) return null;

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-full mx-4',
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[200] overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      <button
        type="button"
        aria-label="Close dialog"
        className="fixed inset-0 bg-black/50 backdrop-blur-sm animate-fade-in border-0 cursor-default"
        onClick={closeOnOverlay ? onClose : undefined}
      />
      <div className="relative z-[201] flex min-h-full items-center justify-center p-4 pointer-events-none">
        <div
          className={cn(
            'pointer-events-auto relative z-[201] bg-white dark:bg-gray-900 rounded-xl border-2 border-acid-lemon shadow-neon',
            'max-h-[min(90vh,calc(100dvh-2rem))] overflow-y-auto',
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
    </div>,
    document.body
  );
}
