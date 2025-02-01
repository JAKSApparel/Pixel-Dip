import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';

export const estimateRentRecovery = async (
  connection: Connection,
  tokenAccount: PublicKey
): Promise<number> => {
  try {
    const accountInfo = await connection.getAccountInfo(tokenAccount);
    return accountInfo?.lamports || 0;
  } catch {
    return 0;
  }
};

export const calculateTotalRentRecoverable = async (
  connection: Connection,
  owner: PublicKey
): Promise<number> => {
  try {
    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(owner, {
      programId: TOKEN_PROGRAM_ID,
    });

    let totalRent = 0;
    for (const { pubkey, account } of tokenAccounts.value) {
      const parsedData = account.data.parsed;
      const amount = parsedData.info.tokenAmount.uiAmount;
      
      // Only count accounts with zero balance
      if (amount === 0) {
        totalRent += account.lamports;
      }
    }

    return totalRent;
  } catch (error) {
    console.error('Failed to calculate recoverable rent:', error);
    return 0;
  }
}; 