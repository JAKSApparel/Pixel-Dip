import { Connection, PublicKey } from '@solana/web3.js';
import { ReadApiAsset, Metadata } from '@metaplex-foundation/mpl-token-metadata';

export type CompressedNFT = {
  id: string;
  name: string;
  symbol: string;
  uri: string;
  compression: {
    eligible: boolean;
    compressed: boolean;
    dataHash: string;
    creatorHash: string;
    assetHash: string;
    tree: string;
    seq: number;
    leafId: number;
  };
};

export const getCompressedNFTs = async (
  connection: Connection,
  owner: PublicKey
): Promise<CompressedNFT[]> => {
  try {
    const response = await fetch(
      `https://api.helius.xyz/v0/token-metadata?api-key=${process.env.NEXT_PUBLIC_HELIUS_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ownerAddress: owner.toString(),
          compressed: true,
        }),
      }
    );

    const data = await response.json();
    
    // Check if data is an array
    if (!Array.isArray(data)) {
      console.warn('Unexpected response format:', data);
      return [];
    }

    // Filter and validate each NFT
    return data.reduce((acc: CompressedNFT[], nft: any) => {
      if (nft && nft.compression?.compressed) {
        try {
          const validNFT: CompressedNFT = {
            id: nft.id || '',
            name: nft.name || '',
            symbol: nft.symbol || '',
            uri: nft.uri || '',
            compression: {
              eligible: nft.compression.eligible || false,
              compressed: nft.compression.compressed || false,
              dataHash: nft.compression.dataHash || '',
              creatorHash: nft.compression.creatorHash || '',
              assetHash: nft.compression.assetHash || '',
              tree: nft.compression.tree || '',
              seq: nft.compression.seq || 0,
              leafId: nft.compression.leafId || 0,
            }
          };
          acc.push(validNFT);
        } catch (err) {
          console.warn('Invalid NFT data:', nft, err);
        }
      }
      return acc;
    }, []);

  } catch (error) {
    console.error('Failed to fetch compressed NFTs:', error);
    return [];
  }
};

// Helper function to validate NFT data
export const isValidCompressedNFT = (nft: any): nft is CompressedNFT => {
  return (
    nft &&
    typeof nft.id === 'string' &&
    typeof nft.name === 'string' &&
    typeof nft.symbol === 'string' &&
    typeof nft.uri === 'string' &&
    nft.compression &&
    typeof nft.compression.compressed === 'boolean'
  );
}; 