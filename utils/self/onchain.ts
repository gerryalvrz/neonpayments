import { Contract, JsonRpcProvider, isAddress } from 'ethers';
import {
  SELF_CELO_SEPOLIA_RPC,
  getSelfEndpoint,
} from '@/config/self';

const VERIFIER_ABI = [
  'function isVerified(address account) view returns (bool)',
] as const;

function getProvider(): JsonRpcProvider {
  return new JsonRpcProvider(SELF_CELO_SEPOLIA_RPC);
}

function getVerifier(address?: string): Contract {
  const endpoint = (address || getSelfEndpoint()).toLowerCase();
  if (!isAddress(endpoint)) {
    throw new Error('Invalid Self verifier address');
  }
  return new Contract(endpoint, VERIFIER_ABI, getProvider());
}

/** Read onchain age verification status from SelfAgeVerifier. */
export async function isSelfVerifiedOnchain(
  account: string,
  verifierAddress?: string
): Promise<boolean> {
  if (!isAddress(account)) return false;
  try {
    const verified = await getVerifier(verifierAddress).isVerified(account);
    return Boolean(verified);
  } catch (error) {
    console.warn('[self] isVerified read failed', error);
    return false;
  }
}

/**
 * Poll until the account is marked verified onchain, or timeout.
 * Useful after mobile deeplink flows where the QR websocket may miss the callback.
 */
export async function waitForSelfVerifiedOnchain(
  account: string,
  options?: {
    verifierAddress?: string;
    timeoutMs?: number;
    intervalMs?: number;
    signal?: AbortSignal;
  }
): Promise<boolean> {
  const timeoutMs = options?.timeoutMs ?? 120_000;
  const intervalMs = options?.intervalMs ?? 3_000;
  const started = Date.now();

  while (Date.now() - started < timeoutMs) {
    if (options?.signal?.aborted) return false;
    if (await isSelfVerifiedOnchain(account, options?.verifierAddress)) {
      return true;
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  return isSelfVerifiedOnchain(account, options?.verifierAddress);
}
