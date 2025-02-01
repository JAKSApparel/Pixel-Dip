import { Connection, PublicKey } from '@solana/web3.js';
import { TokenInfo, TokenAccount } from '@/types';
import { ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import axios from 'axios';
import { Metadata } from '@/lib/metadata';

export async function getTokenInfo(
  connection: Connection,
  mintAddress: string
): Promise<TokenInfo | null> {
  try {
    const mintPubkey = new PublicKey(mintAddress);
    const tokenAccountInfo = await connection.getParsedAccountInfo(mintPubkey);
    
    if (!tokenAccountInfo.value) return null;
    
    const info = (tokenAccountInfo.value.data as any).parsed.info;
    const supply = BigInt(info.supply);
    const decimals = info.decimals;
    const isNFT = supply === BigInt(1) && decimals === 0;
    
    return {
      mint: mintAddress,
      decimals,
      supply,
      isNFT
    };
  } catch (error) {
    console.error('Error getting token info:', error);
    return null;
  }
}

export async function getTokenAccounts(
  connection: Connection,
  owner: PublicKey
): Promise<TokenAccount[]> {
  try {
    const accounts = await connection.getParsedTokenAccountsByOwner(
      owner,
      { programId: TOKEN_PROGRAM_ID }
    );

    const validAccounts = accounts.value
      .filter(account => {
        const amount = BigInt(account.account.data.parsed.info.tokenAmount.amount);
        return amount > BigInt(0);
      })
      .map(account => {
        const parsedInfo = account.account.data.parsed.info;
        return {
          mint: parsedInfo.mint,
          amount: BigInt(parsedInfo.tokenAmount.amount),
          decimals: parsedInfo.tokenAmount.decimals,
          uiAmount: parsedInfo.tokenAmount.uiAmount,
          isNFT: parsedInfo.tokenAmount.decimals === 0 && parsedInfo.tokenAmount.amount === "1",
          tokenAccount: account.pubkey
        };
      });

    // Get additional token metadata
    const enrichedAccounts = await Promise.all(
      validAccounts.map(async (account) => {
        try {
          const mintInfo = await connection.getParsedAccountInfo(new PublicKey(account.mint));
          const metadata = (mintInfo.value?.data as any)?.parsed.info;
          return {
            ...account,
            symbol: metadata?.symbol,
            name: metadata?.name
          };
        } catch (error) {
          console.error(`Error fetching metadata for token ${account.mint}:`, error);
          return account;
        }
      })
    );

    return enrichedAccounts;
  } catch (error) {
    console.error('Error fetching token accounts:', error);
    return [];
  }
}

export async function getEnhancedTokenMetadata(
  connection: Connection,
  tokenAccount: TokenAccount
): Promise<EnhancedTokenMetadata> {
  try {
    // Fetch Solscan metadata
    const solscanData = await axios.get(
      `https://public-api.solscan.io/token/meta?tokenAddress=${tokenAccount.mint}`
    ).then(res => res.data).catch(() => null);

    // Fetch token metadata from chain
    let metadata = null;
    try {
      const metadataPDA = await Metadata.getPDA(new PublicKey(tokenAccount.mint));
      const metadataAccount = await Metadata.fromAccountAddress(connection, metadataPDA);
      const externalMetadata = await axios.get(metadataAccount.data.uri).catch(() => null);
      metadata = externalMetadata?.data;
    } catch (error) {
      console.error('Error fetching on-chain metadata:', error);
    }

    return {
      ...tokenAccount,
      name: metadata?.name || solscanData?.symbol || tokenAccount.symbol || 'Unknown Token',
      symbol: solscanData?.symbol || tokenAccount.symbol,
      image: metadata?.image || solscanData?.icon,
      marketCap: solscanData?.marketCap,
      price: solscanData?.price,
      volume24h: solscanData?.volume24h,
      holderCount: solscanData?.holder,
      verified: solscanData?.verified || false,
    };
  } catch (error) {
    console.error('Error fetching enhanced metadata:', error);
    return {
      ...tokenAccount,
      name: tokenAccount.symbol || 'Unknown Token',
    };
  }
} 