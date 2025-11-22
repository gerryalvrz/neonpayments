/**
 * Celo Name Service (CNS) Utilities
 * 
 * CNS is integrated with ENS, allowing resolution of .celo.eth names
 * @see https://names.celo.org
 */

/**
 * Check if a string looks like a CNS/ENS name
 */
export function isCNSName(input: string): boolean {
  // CNS names end with .celo.eth or .eth
  // Also check for common ENS patterns
  return /^[a-z0-9-]+\.(celo\.)?eth$/i.test(input.trim());
}

/**
 * Check if a string looks like a valid Ethereum/Celo address
 */
export function isAddress(input: string): boolean {
  // Ethereum/Celo addresses are 42 characters (0x + 40 hex chars)
  return /^0x[a-fA-F0-9]{40}$/.test(input.trim());
}

/**
 * Resolve a CNS name to an address
 * 
 * This uses the ENS public resolver API which also works for CNS
 * since CNS is integrated with ENS.
 * 
 * For production use, consider using ethers.js for more reliable resolution:
 * ```typescript
 * import { ethers } from 'ethers';
 * const provider = new ethers.JsonRpcProvider('https://forno.celo.org');
 * const address = await provider.resolveName(name);
 * ```
 * 
 * @param name - The CNS name (e.g., "gerry.celo.eth")
 * @returns The resolved address, or null if not found
 */
export async function resolveCNSName(name: string): Promise<string | null> {
  try {
    const normalizedName = name.trim().toLowerCase();
    
    // Try multiple resolver endpoints for better reliability
    const resolvers = [
      // Primary: ENS public resolver
      `https://api.ensideas.com/ens/resolve/${encodeURIComponent(normalizedName)}`,
      // Alternative: ENS domains resolver
      `https://resolve.ens.domains/${encodeURIComponent(normalizedName)}`,
    ];

    for (const resolverUrl of resolvers) {
      try {
        // Create a timeout promise
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Timeout')), 5000);
        });

        const response = await Promise.race([
          fetch(resolverUrl, {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
            },
          }),
          timeoutPromise,
        ]);

        if (response.ok) {
          const data = await response.json();
          // Handle different response formats
          const address = data?.address || data?.result?.address || data?.data?.address;
          if (address && /^0x[a-fA-F0-9]{40}$/.test(address)) {
            return address;
          }
        }
      } catch (fetchError) {
        // Continue to next resolver if this one fails
        console.debug(`Resolver failed:`, fetchError);
        continue;
      }
    }

    return null;
  } catch (error) {
    console.error('Error resolving CNS name:', error);
    return null;
  }
}

/**
 * Resolve an input to an address
 * 
 * If the input is already an address, return it.
 * If it's a CNS name, resolve it to an address.
 * 
 * @param input - Either a CNS name or an address
 * @returns The resolved address, or null if invalid/unresolvable
 */
export async function resolveToAddress(input: string): Promise<string | null> {
  const trimmed = input.trim();

  // If it's already an address, return it
  if (isAddress(trimmed)) {
    return trimmed;
  }

  // If it's a CNS name, resolve it
  if (isCNSName(trimmed)) {
    return await resolveCNSName(trimmed);
  }

  // Invalid format
  return null;
}

/**
 * Format an address for display (with truncation)
 */
export function formatAddress(address: string, startChars = 6, endChars = 4): string {
  if (!address || address.length < startChars + endChars) {
    return address;
  }
  return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
}

