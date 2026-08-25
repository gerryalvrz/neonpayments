'use client';

import React, { useCallback, useRef, useState } from 'react';
import { cn } from '@/utils/cn';
import { Card } from '@/components/UI/Card';

type NeonHoverCardProps = React.ComponentProps<typeof Card>;

export function NeonHoverCard({
  className,
  children,
  onMouseMove,
  onMouseLeave,
  onMouseEnter,
  ...props
}: NeonHoverCardProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);

  const updateGlowPosition = useCallback(
    (clientX: number, clientY: number) => {
      const wrap = wrapRef.current;
      if (!wrap) return;
      const rect = wrap.getBoundingClientRect();
      wrap.style.setProperty('--mouse-x', `${clientX - rect.left}px`);
      wrap.style.setProperty('--mouse-y', `${clientY - rect.top}px`);
    },
    []
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      updateGlowPosition(e.clientX, e.clientY);
      onMouseMove?.(e);
    },
    [onMouseMove, updateGlowPosition]
  );

  const handleMouseEnter = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      setActive(true);
      updateGlowPosition(e.clientX, e.clientY);
      onMouseEnter?.(e);
    },
    [onMouseEnter, updateGlowPosition]
  );

  const handleMouseLeave = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      setActive(false);
      onMouseLeave?.(e);
    },
    [onMouseLeave]
  );

  return (
    <div
      ref={wrapRef}
      className={cn('card-neon-hover-wrap', active && 'card-neon-hover-wrap--active')}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="card-neon-glow" aria-hidden />
      <div className="card-neon-glow card-neon-glow--outer" aria-hidden />
      <Card
        className={cn(
          'card-neon-surface relative z-10',
          props.variant === 'premium' && 'card-neon-surface--premium',
          className
        )}
        {...props}
      >
        {children}
      </Card>
    </div>
  );
}
