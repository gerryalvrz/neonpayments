'use client';

import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/utils/cn';
import { Icon, ChevronDownIcon } from '@/components/Icons';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SelectProps {
  label?: string;
  options: SelectOption[];
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  error?: string;
  helperText?: string;
  disabled?: boolean;
  className?: string;
}

export function Select({
  label,
  options,
  value,
  onChange,
  placeholder = 'Select an option',
  error,
  helperText,
  disabled,
  className,
}: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const selectedOption = options.find(opt => opt.value === value);
  const hasError = !!error;

  return (
    <div className={cn('w-full', className)}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          {label}
        </label>
      )}
      <div ref={selectRef} className="relative">
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className={cn(
            'w-full rounded-lg border-2 bg-glass-white dark:bg-gray-800/85 backdrop-blur-[20px]',
            'px-4 py-2.5 text-left text-gray-900 dark:text-gray-100',
            'focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all',
            'flex items-center justify-between',
            hasError
              ? 'border-semantic-error focus:ring-red-500'
              : 'border-acid-lemon focus:ring-acid-lemon',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
        >
          <span className={cn(!selectedOption && 'text-gray-400 dark:text-gray-500')}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <Icon
            color="gray"
            size="sm"
            className={cn('transition-transform', isOpen && 'rotate-180')}
          >
            <ChevronDownIcon />
          </Icon>
        </button>

        {isOpen && (
          <div className="absolute z-10 w-full mt-2 bg-glass-white dark:bg-gray-800/95 backdrop-blur-[20px] rounded-lg border-2 border-acid-lemon shadow-neon max-h-60 overflow-y-auto">
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  if (!option.disabled && onChange) {
                    onChange(option.value);
                    setIsOpen(false);
                  }
                }}
                disabled={option.disabled}
                className={cn(
                  'w-full px-4 py-2.5 text-left text-gray-900 dark:text-gray-100 hover:bg-acid-lemon/20 dark:hover:bg-acid-lemon/30 transition-colors',
                  'first:rounded-t-lg last:rounded-b-lg',
                  option.value === value && 'bg-acid-lemon/30 font-medium',
                  option.disabled && 'opacity-50 cursor-not-allowed'
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        )}
      </div>
      {error && (
        <p className="mt-1.5 text-sm text-semantic-error" role="alert">
          {error}
        </p>
      )}
      {helperText && !error && (
        <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400">{helperText}</p>
      )}
    </div>
  );
}

