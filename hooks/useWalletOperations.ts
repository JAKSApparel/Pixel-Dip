import { useCallback, useState } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { 
  Transaction, 
  PublicKey, 
  LAMPORTS_PER_SOL,
  SystemProgram,
} from '@solana/web3.js';
import { createBurnCheckedInstruction, createCloseAccountInstruction } from '@solana/spl-token';
import { BurnType, TransactionResult } from '@/types';

// Platform fee configuration
const PLATFORM_FEE = 0.001 * LAMPORTS_PER_SOL; // 0.001 SOL platform fee
const PLATFORM_FEE_SHARE = 0.2; // Platform keeps 20% of reclaimed rent
const FEE_COLLECTOR = new PublicKey(process.env.NEXT_PUBLIC_FEE_COLLECTOR!);

export function useWalletOperations() {
  const { publicKey, sendTransaction } = useWallet();
  const { connection } = useConnection();
  const [loading, setLoading] = useState(false);

  const handleBurnToken = useCallback(async (
    tokenAccount: PublicKey,
    mint: PublicKey,
    amount: bigint,
    decimals: number
  ): Promise<TransactionResult> => {
    try {
      const transaction = new Transaction();
      
      // Add platform fee instruction
      transaction.add(
        SystemProgram.transfer({
          fromPubkey: publicKey!,
          toPubkey: FEE_COLLECTOR,
          lamports: PLATFORM_FEE,
        })
      );

      // Add burn instruction
      transaction.add(
        createBurnCheckedInstruction(
          tokenAccount,
          mint,
          publicKey!,
          amount,
          decimals
        )
      );

      // Calculate rent to be reclaimed
      const accountInfo = await connection.getAccountInfo(tokenAccount);
      const rentToReclaim = accountInfo?.lamports || 0;
      
      // If burning all tokens, close the account and split the rent
      if (accountInfo && amount.toString() === accountInfo.data.parsed.info.tokenAmount.amount) {
        // Calculate platform's share of rent
        const platformShare = Math.floor(rentToReclaim * PLATFORM_FEE_SHARE);
        const userShare = rentToReclaim - platformShare;

        // Close token account and send rent shares
        transaction.add(
          createCloseAccountInstruction(
            tokenAccount,
            publicKey!, // User gets their share
            publicKey!
          )
        );

        // Send platform's share of rent
        if (platformShare > 0) {
          transaction.add(
            SystemProgram.transfer({
              fromPubkey: publicKey!,
              toPubkey: FEE_COLLECTOR,
              lamports: platformShare,
            })
          );
        }

        console.log(`Rent distribution: Platform: ${platformShare/LAMPORTS_PER_SOL} SOL, User: ${userShare/LAMPORTS_PER_SOL} SOL`);
      }

      const { blockhash } = await connection.getLatestBlockhash('confirmed');
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey!;

      const signature = await sendTransaction(transaction, connection);
      await connection.confirmTransaction(signature, 'confirmed');
      
      return { signature };
    } catch (error) {
      console.error('Burn failed:', error);
      return { 
        signature: '', 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }, [publicKey, connection, sendTransaction]);

  return {
    handleBurnToken,
    loading,
    setLoading
  };
} 