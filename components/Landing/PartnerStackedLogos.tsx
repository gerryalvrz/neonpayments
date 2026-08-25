'use client';

import { StackedLogos } from '@/components/UI/stacked-logos';
import { PARTNER_LOGO_GROUPS } from '@/components/Landing/partner-logos';

export function PartnerStackedLogos() {
  return (
    <div className="w-full overflow-x-auto">
      <StackedLogos
        logoGroups={PARTNER_LOGO_GROUPS}
        duration={24}
        stagger={3}
        logoWidth="128px"
        className="mx-auto min-w-fit"
      />
    </div>
  );
}
