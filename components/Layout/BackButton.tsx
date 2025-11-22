'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/UI/Button';
import { Icon, ChevronLeftIcon } from '@/components/Icons';
import { useApp } from '@/context/AppContext';

export function BackButton() {
  const router = useRouter();
  const { language } = useApp();

  const labels = {
    en: 'Back',
    es: 'Atrás',
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => router.back()}
      className="mb-4"
    >
      <Icon>
        <ChevronLeftIcon />
      </Icon>
      {labels[language]}
    </Button>
  );
}
