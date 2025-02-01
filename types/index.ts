import { PublicKey } from '@solana/web3.js';

export type BurnType = 'token' | 'nft' | 'lp' | 'serum';

export type TokenInfo = {
  mint: string;
  decimals: number;
  supply?: bigint;
  isNFT: boolean;
};

export type TokenAccount = {
  mint: string;
  amount: bigint;
  decimals: number;
  uiAmount: number;
  symbol?: string;
  name?: string;
  isNFT: boolean;
  tokenAccount: PublicKey;
};

export type TransactionResult = {
  signature: string;
  error?: string;
};

export type EnhancedTokenMetadata = {
  mint: string;
  amount: bigint;
  decimals: number;
  uiAmount: number;
  symbol?: string;
  name?: string;
  image?: string;
  isNFT: boolean;
  tokenAccount: PublicKey;
  // Additional metadata
  marketCap?: number;
  price?: number;
  volume24h?: number;
  holderCount?: number;
  verified?: boolean;
}; 