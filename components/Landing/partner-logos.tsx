'use client';

import React, { type SVGProps } from "react";

function CeloLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 2500 2500" fill="none" role="img" {...props}>
      <title>Celo</title>
      <circle cx="1250" cy="1250" r="1250" fill="#FCFF52" />
      <path
        fill="#000"
        fillRule="evenodd"
        clipRule="evenodd"
        d="M1949.3 546.2H550.7v1407.7h1398.7v-491.4h-232.1c-80 179.3-260.1 304.1-466.2 304.1-284.1 0-514.2-233.6-514.2-517.5 0-284 230.1-515.6 514.2-515.6 210.1 0 390.2 128.9 470.2 312.1h228.1V546.2z"
      />
    </svg>
  );
}

function MiniPayLogo(props: SVGProps<SVGSVGElement>) {
  const clipId = React.useId().replace(/:/g, "");
  return (
    <svg viewBox="0 0 256 256" fill="none" role="img" {...props}>
      <title>MiniPay</title>
      <defs>
        <clipPath id={clipId}>
          <circle cx="128" cy="128" r="128" />
        </clipPath>
      </defs>
      <circle cx="128" cy="128" r="128" fill="#0A0A0A" />
      <g clipPath={`url(#${clipId})`}>
        <image href="/logos/minipay.png" width="256" height="256" />
      </g>
    </svg>
  );
}

function RipioLogo(props: SVGProps<SVGSVGElement>) {
  const clipId = React.useId().replace(/:/g, "");
  return (
    <svg viewBox="0 0 408 408" fill="none" role="img" {...props}>
      <title>Ripio</title>
      <defs>
        <clipPath id={clipId}>
          <circle cx="204" cy="204" r="204" />
        </clipPath>
      </defs>
      <circle cx="204" cy="204" r="204" fill="#6B2DFF" />
      <g clipPath={`url(#${clipId})`}>
        <image href="/logos/ripio.png" width="408" height="408" />
      </g>
    </svg>
  );
}

function pinkedSquarePath(x: number, y: number, size: number, teeth = 8) {
  const step = size / teeth;
  const amp = size * 0.055;
  const pts: string[] = [];

  for (let i = 0; i <= teeth; i++) {
    pts.push(`${x + i * step},${y + (i % 2 === 0 ? 0 : amp)}`);
  }
  for (let i = 1; i <= teeth; i++) {
    pts.push(`${x + size + (i % 2 === 0 ? 0 : amp)},${y + i * step}`);
  }
  for (let i = 1; i <= teeth; i++) {
    pts.push(`${x + size - i * step},${y + size + (i % 2 === 0 ? 0 : amp)}`);
  }
  for (let i = 1; i < teeth; i++) {
    pts.push(`${x - (i % 2 === 0 ? 0 : amp)},${y + size - i * step}`);
  }

  return `M${pts.join("L")}Z`;
}

function TextileLogo(props: SVGProps<SVGSVGElement>) {
  const clipId = React.useId().replace(/:/g, "");
  const back = pinkedSquarePath(38, 38, 100, 9);
  const front = pinkedSquarePath(78, 78, 110, 9);

  return (
    <svg viewBox="0 0 220 220" fill="none" role="img" {...props}>
      <title>Textile</title>
      <defs>
        <clipPath id={clipId}>
          <path d={front} />
        </clipPath>
      </defs>
      <circle cx="110" cy="110" r="110" fill="#FAF9F6" />
      <path d={back} fill="#E8A6BE" stroke="#1A1A1A" strokeWidth="2.5" />
      <g clipPath={`url(#${clipId})`}>
        <rect x="70" y="70" width="40" height="130" fill="#3E70C4" />
        <rect x="110" y="70" width="38" height="130" fill="#E8C44A" />
        <rect x="148" y="70" width="50" height="130" fill="#3E70C4" />
      </g>
      <path d={front} fill="none" stroke="#1A1A1A" strokeWidth="2.5" />
    </svg>
  );
}

function MentoLogo(props: SVGProps<SVGSVGElement>) {
  const clipId = React.useId().replace(/:/g, "");
  return (
    <svg viewBox="0 0 200 200" fill="none" role="img" {...props}>
      <title>Mento</title>
      <defs>
        <clipPath id={clipId}>
          <circle cx="100" cy="100" r="100" />
        </clipPath>
      </defs>
      <circle cx="100" cy="100" r="100" fill="#FFFFFF" />
      <g clipPath={`url(#${clipId})`}>
        <image href="/logos/mento.png" width="200" height="200" />
      </g>
    </svg>
  );
}

const logoClass = "h-12 w-12 sm:h-14 sm:w-14";

/** One column per partner — five grid squares, one brand each */
export const PARTNER_LOGO_GROUPS: React.ReactNode[][] = [
  [<CeloLogo key="celo" className={logoClass} />],
  [<MiniPayLogo key="minipay" className={logoClass} />],
  [<RipioLogo key="ripio" className={logoClass} />],
  [<TextileLogo key="textile" className={logoClass} />],
  [<MentoLogo key="mento" className={logoClass} />],
];
