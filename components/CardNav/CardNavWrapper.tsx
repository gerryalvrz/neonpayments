'use client';

import CardNav from './CardNav';
import { useNavItems } from './NavItems';

export function CardNavWrapper() {
  const items = useNavItems();

  return (
    <CardNav 
      logo="NeonPay MX" 
      items={items}
      baseColor="rgba(204, 255, 0, 0.2)"
      menuColor="#CCFF00"
      buttonBgColor="#CCFF00"
      buttonTextColor="#000"
    />
  );
}

