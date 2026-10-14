/**
 * Payments settle on Stellar testnet through the team's Paiflow deployment
 * (Receive → Split), so every link points at the testnet explorer.
 */

/** Receipt "Network" row and other places that name the rail. */
export const NETWORK_NAME = 'Stellar Testnet (Paiflow)';

export const EXPLORER_BASE = 'https://stellar.expert/explorer/testnet';

export const explorerTxUrl = (hash: string) => `${EXPLORER_BASE}/tx/${hash}`;
export const explorerAccountUrl = (accountId: string) => `${EXPLORER_BASE}/account/${accountId}`;
export const explorerContractUrl = (contractId: string) => `${EXPLORER_BASE}/contract/${contractId}`;
