/**
 * Self Protocol (Self Pass) — onchain verification on Celo Sepolia.
 * @see https://docs.self.xyz/
 * @see https://github.com/selfxyz/self-integration-boilerplate
 */

export const SELF_CELO_SEPOLIA_CHAIN_ID = 11142220;

/** Identity Verification Hub V2 — Celo Sepolia (mock passports). */
export const SELF_HUB_V2_SEPOLIA =
  '0x16ECBA51e18a4a7e61fdC417f0d47AFEeDfbed74' as const;

/** NeonPay SelfAgeVerifier deployed on Celo Sepolia. */
export const SELF_DEFAULT_VERIFIER =
  '0x2a57095a0f93d23d03be23ea926b52c6c30d23bb' as const;

export const SELF_CELO_SEPOLIA_RPC =
  process.env.NEXT_PUBLIC_SELF_RPC_URL ||
  'https://forno.celo-sepolia.celo-testnet.org';

export const SELF_SCOPE_SEED =
  process.env.NEXT_PUBLIC_SELF_SCOPE ||
  process.env.NEXT_PUBLIC_SELF_SCOPE_SEED ||
  'neon-pay';

export const SELF_APP_NAME =
  process.env.NEXT_PUBLIC_SELF_APP_NAME || 'Neon Pay KYC';

export const SELF_ENDPOINT_TYPE =
  (process.env.NEXT_PUBLIC_SELF_ENDPOINT_TYPE as
    | 'staging_celo'
    | 'celo'
    | 'staging_https'
    | 'https'
    | undefined) || 'staging_celo';

export const SELF_MIN_AGE = 18;

/** Verifier contract address (must be lowercase for SelfAppBuilder). */
export function getSelfEndpoint(): string {
  const fromEnv = process.env.NEXT_PUBLIC_SELF_ENDPOINT?.trim();
  return (fromEnv || SELF_DEFAULT_VERIFIER).toLowerCase();
}

export function isSelfHexAddress(value: string | null | undefined): boolean {
  return Boolean(value && /^0x[a-fA-F0-9]{40}$/.test(value));
}
