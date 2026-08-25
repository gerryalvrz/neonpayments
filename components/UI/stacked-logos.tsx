"use client";

import * as React from "react";
import { cn } from "@/utils/cn";

export interface StackedLogosProps {
  /** Array of logo groups - each group is an array of React nodes */
  logoGroups: React.ReactNode[][];
  /** Animation duration in seconds. Default: 30 */
  duration?: number;
  /** Stagger factor for animation timing between groups. Default: 0 */
  stagger?: number;
  /** Width of each logo container. Default: "200px" */
  logoWidth?: string;
  /** Additional CSS classes */
  className?: string;
}

export const StackedLogos = ({
  logoGroups,
  duration = 30,
  stagger = 0,
  logoWidth = "200px",
  className,
}: StackedLogosProps) => {
  const itemCount = logoGroups[0]?.length || 0;
  const columns = logoGroups.length;
  const containerRef = React.useRef<HTMLDivElement>(null);
  const gridRef = React.useRef<HTMLDivElement>(null);

  const handleMouseMove = React.useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!containerRef.current || !gridRef.current) return;

      const rect = gridRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      containerRef.current.style.setProperty("--mouse-x", `${x}px`);
      containerRef.current.style.setProperty("--mouse-y", `${y}px`);
    },
    [],
  );

  return (
    <div
      ref={containerRef}
      className={cn("stacked-logos relative w-auto", className)}
      style={
        {
          "--duration": duration,
          "--items": itemCount,
          "--lists": columns,
          "--stagger": stagger,
          "--logo-width": logoWidth,
        } as React.CSSProperties
      }
      onMouseMove={handleMouseMove}
    >
      <div
        ref={gridRef}
        className="grid relative mx-auto w-fit"
        style={{
          gridTemplateColumns: `repeat(${columns}, ${logoWidth})`,
          gridAutoRows: logoWidth,
        }}
      >
        <div
          className="stacked-logos__glow pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 z-10"
          style={{
            background:
              "radial-gradient(500px circle at var(--mouse-x, 0) var(--mouse-y, 0), rgba(204,255,0,0.12), transparent 70%)",
          }}
        />

        <div
          className="stacked-logos__border-glow pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 z-20"
          style={{
            background:
              "radial-gradient(600px circle at var(--mouse-x, 0) var(--mouse-y, 0), rgba(204,255,0,0.9), transparent 40%)",
            maskImage: `
              repeating-linear-gradient(to right, transparent, transparent calc(${logoWidth} - 1px), black calc(${logoWidth} - 1px), black ${logoWidth}),
              linear-gradient(to bottom, black 0, black 1px, transparent 1px, transparent calc(100% - 1px), black calc(100% - 1px), black 100%)
            `,
            WebkitMaskImage: `
              repeating-linear-gradient(to right, transparent, transparent calc(${logoWidth} - 1px), black calc(${logoWidth} - 1px), black ${logoWidth}),
              linear-gradient(to bottom, black 0, black 1px, transparent 1px, transparent calc(100% - 1px), black calc(100% - 1px), black 100%)
            `,
            maskComposite: "add",
            WebkitMaskComposite: "source-over",
          }}
        />

        <div
          className="stacked-logos__border-glow pointer-events-none absolute top-0 bottom-0 left-0 w-px opacity-0 transition-opacity duration-300 z-20"
          style={{
            background:
              "radial-gradient(600px circle at var(--mouse-x, 0) var(--mouse-y, 0), rgba(204,255,0,0.9), transparent 40%)",
          }}
        />

        {logoGroups.map((logos, groupIndex) => (
          <div
            key={groupIndex}
            className="stacked-logos__cell relative grid aspect-square"
            style={
              {
                "--index": groupIndex,
                gridTemplate: "1fr / 1fr",
                width: logoWidth,
                height: logoWidth,
              } as React.CSSProperties
            }
          >
            <div className="absolute top-0 bottom-0 right-0 w-px bg-gray-200 dark:bg-gray-800" />
            <div className="absolute left-0 right-0 bottom-0 h-px bg-gray-200 dark:bg-gray-800" />
            <div className="absolute left-0 right-0 top-0 h-px bg-gray-200 dark:bg-gray-800" />
            {groupIndex === 0 && (
              <div className="absolute top-0 bottom-0 left-0 w-px bg-gray-200 dark:bg-gray-800" />
            )}

            {logos.map((logo, logoIndex) => (
              <div
                key={logoIndex}
                className="stacked-logos__item col-start-1 row-start-1 grid size-full place-items-center p-4"
                data-logo
                style={{ "--i": logoIndex } as React.CSSProperties}
              >
                <div
                  className={cn(
                    "stacked-logos__logo flex size-14 items-center justify-center sm:size-16 [&>svg]:h-full [&>svg]:w-full [&>svg]:max-h-full [&>svg]:max-w-full [&>img]:h-full [&>img]:w-full [&>img]:object-contain",
                    itemCount === 1 && "stacked-logos__logo--static"
                  )}
                >
                  {logo}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

StackedLogos.displayName = "StackedLogos";

export default StackedLogos;
