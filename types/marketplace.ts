import { PublicKey } from '@solana/web3.js';

export type NFTListing = {
  mint: PublicKey;
  price: number;
  seller: PublicKey;
  tokenAccount: PublicKey;
  metadata: NFTMetadata;
};

export type NFTMetadata = {
  name: string;
  symbol: string;
  description: string;
  image: string;
  attributes?: NFTAttribute[];
  externalUrl?: string;
};

export type NFTAttribute = {
  trait_type: string;
  value: string | number;
};

export type MarketplaceStats = {
  totalVolume: number;
  floorPrice: number;
  listings: number;
  holders: number;
}; 