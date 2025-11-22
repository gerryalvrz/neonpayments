/**
 * Environment Detection Utilities
 * 
 * Detects whether the app is running in MiniPay or standalone environment
 */

export type Environment = 'minipay' | 'standalone';

/**
 * Check if running in MiniPay environment
 * MiniPay exposes wallet via window.ethereum with isMiniPay flag
 */
export function isMiniPayEnvironment(): boolean {
  if (typeof window === 'undefined') return false;

  // Check for MiniPay-specific properties
  const ethereum = (window as any).ethereum;
  
  if (ethereum?.isMiniPay === true) {
    return true;
  }

  // Alternative check: MiniPay might expose a minipay object
  if ((window as any).minipay) {
    return true;
  }

  // Check user agent for MiniPay
  const userAgent = navigator.userAgent.toLowerCase();
  if (userAgent.includes('minipay') || userAgent.includes('opera mini')) {
    return true;
  }

  return false;
}

/**
 * Get the current environment
 */
export function getEnvironment(): Environment {
  return isMiniPayEnvironment() ? 'minipay' : 'standalone';
}

/**
 * Check if running on mobile device
 */
export function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
}

/**
 * Check if running on desktop
 */
export function isDesktopDevice(): boolean {
  return !isMobileDevice();
}

