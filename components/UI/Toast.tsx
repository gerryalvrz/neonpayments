'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { cn } from '@/utils/cn';
import { Icon, CheckCircleIcon, ExclamationCircleIcon, XIcon } from '@/components/Icons';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  title?: string;
  duration?: number;
}

interface ToastContextType {
  toasts: Toast[];
  showToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newToast: Toast = { ...toast, id };
    
    setToasts(prev => [...prev, newToast]);

    const duration = toast.duration || 5000;
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, showToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}

function ToastContainer({ toasts, onRemove }: { toasts: Toast[]; onRemove: (id: string) => void }) {
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-md w-full">
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  const icons = {
    success: CheckCircleIcon,
    error: ExclamationCircleIcon,
    info: ExclamationCircleIcon,
    warning: ExclamationCircleIcon,
  };

  const colors = {
    success: 'bg-semantic-success text-white border-green-600',
    error: 'bg-semantic-error text-white border-red-600',
    info: 'bg-semantic-info text-white border-blue-600',
    warning: 'bg-semantic-warning text-white border-yellow-600',
  };

  const IconComponent = icons[toast.type];

  return (
    <div
      className={cn(
        'rounded-lg border-2 shadow-lg backdrop-blur-[20px] p-4 flex items-start gap-3 animate-slide-up',
        colors[toast.type]
      )}
      role="alert"
    >
      <Icon color="white" size="md">
        <IconComponent />
      </Icon>
      <div className="flex-1 min-w-0">
        {toast.title && (
          <h4 className="font-semibold mb-1">{toast.title}</h4>
        )}
        <p className="text-sm">{toast.message}</p>
      </div>
      <button
        onClick={() => onRemove(toast.id)}
        className="flex-shrink-0 p-1 hover:bg-black/20 rounded transition-colors"
        aria-label="Close"
      >
        <Icon color="white" size="sm">
          <XIcon />
        </Icon>
      </button>
    </div>
  );
}

