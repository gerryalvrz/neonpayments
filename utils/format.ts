/**
 * Format currency amounts with proper localization
 */
export function formatCurrency(
  amount: number,
  currency: string = 'USDC',
  locale: string = 'en-US',
  options?: Intl.NumberFormatOptions
): string {
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    ...options,
  }).format(amount);
}

/**
 * Format large numbers with abbreviations (K, M, B)
 */
export function formatCompactNumber(amount: number, locale: string = 'en-US'): string {
  return new Intl.NumberFormat(locale, {
    notation: 'compact',
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format wallet address for display
 */
export function formatAddress(address: string, startChars: number = 6, endChars: number = 4): string {
  if (!address || address.length < startChars + endChars) return address;
  return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
}

/**
 * Format date for transactions
 */
export function formatTransactionDate(
  timestamp: number,
  locale: string = 'en-US',
  includeTime: boolean = true
): string {
  const date = new Date(timestamp);
  const options: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
    ...(includeTime && {
      hour: '2-digit',
      minute: '2-digit',
    }),
  };
  return new Intl.DateTimeFormat(locale, options).format(date);
}

