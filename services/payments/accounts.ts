import { apiFetch } from '@/services/api';

/** GET /api/wallet/stellar/accounts/:address: any testnet account, read-only. */
export type StellarAccount = {
  address: string;
  exists: boolean;
  assetCode: 'XLM';
  /** Seven-decimal XLM balance, or null when the account doesn't exist yet. */
  balance: string | null;
};

/** Quick shape check (G + 55 base32 characters) before asking the server, which checks the checksum. */
export const looksLikeStellarAddress = (value: string) => /^G[A-Z2-7]{55}$/.test(value.trim());

export function lookupStellarAccount(address: string): Promise<StellarAccount> {
  return apiFetch<StellarAccount>(`/api/wallet/stellar/accounts/${encodeURIComponent(address.trim())}`, { timeoutMs: 10_000 });
}

/** "GB23VZ…KU7E": the same 6 + 4 the design uses for the wallet address. */
export const shortAccount = (address: string) => (address.length > 12 ? `${address.slice(0, 6)}…${address.slice(-4)}` : address);
