import { useCallback, useState } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { 
  Transaction, 
  PublicKey, 
  LAMPORTS_PER_SOL,
  SystemProgram,
  Commitment
} from '@solana/web3.js';
import { createBurnCheckedInstruction, createCloseAccountInstruction, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { BurnType, TransactionResult } from '@/types';
import { toast } from 'sonner';

// Platform fee configuration
const PLATFORM_FEE = 0.001 * LAMPORTS_PER_SOL; // 0.001 SOL platform fee
const PLATFORM_FEE_SHARE = 0.05; // 5%
const PLATFORM_ADDRESS = new PublicKey(process.env.NEXT_PUBLIC_FEE_COLLECTOR || '11111111111111111111111111111111');

// Transaction configuration
const TX_TIMEOUT = 60000; // 60 seconds
const COMMITMENT: Commitment = 'confirmed';

export function useWalletOperations() {
  const { publicKey, sendTransaction } = useWallet();
  const { connection } = useConnection();
  const [loading, setLoading] = useState(false);

  const confirmTransaction = async (signature: string): Promise<boolean> => {
    const startTime = Date.now();
    
    while (Date.now() - startTime < TX_TIMEOUT) {
      const confirmation = await connection.getSignatureStatus(signature);
      
      if (confirmation.value?.confirmationStatus === COMMITMENT) {
        return true;
      }
      
      // Wait before checking again
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    throw new Error(`Transaction confirmation timeout after ${TX_TIMEOUT/1000} seconds`);
  };

  const handleBurnToken = useCallback(async (
    tokenAccount: PublicKey,
    mint: PublicKey,
    amount: bigint,
    decimals: number
  ): Promise<TransactionResult> => {
    try {
      const latestBlockhash = await connection.getLatestBlockhash(COMMITMENT);
      const transaction = new Transaction({
        feePayer: publicKey!,
        ...latestBlockhash,
      });
      
      // Add platform fee instruction
      transaction.add(
        SystemProgram.transfer({
          fromPubkey: publicKey!,
          toPubkey: PLATFORM_ADDRESS,
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
              toPubkey: PLATFORM_ADDRESS,
              lamports: platformShare,
            })
          );
        }

        console.log(`Rent distribution: Platform: ${platformShare/LAMPORTS_PER_SOL} SOL, User: ${userShare/LAMPORTS_PER_SOL} SOL`);
      }

      const signature = await sendTransaction(transaction, connection, {
        skipPreflight: false,
        preflightCommitment: COMMITMENT,
        maxRetries: 3,
      });

      // Wait for confirmation with timeout
      await confirmTransaction(signature);
      
      return { signature };
    } catch (error) {
      console.error('Burn failed:', error);
      if (error instanceof Error && error.message.includes('timeout')) {
        toast.error('Transaction timed out. Please check Solana Explorer for status.');
      } else {
        toast.error(error instanceof Error ? error.message : 'Burn failed');
      }
      return { 
        signature: '', 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }, [publicKey, connection, sendTransaction]);

  const closeEmptyTokenAccounts = async (accounts: { pubkey: PublicKey, lamports: number }[]) => {
    if (!publicKey) throw new Error('Wallet not connected');

    try {
      const latestBlockhash = await connection.getLatestBlockhash(COMMITMENT);
      const transaction = new Transaction({
        feePayer: publicKey,
        ...latestBlockhash,
      });

      let totalRent = 0;

      // Add close instructions for each empty account
      accounts.forEach(({ pubkey, lamports }) => {
        transaction.add(
          createCloseAccountInstruction(
            pubkey,
            publicKey,
            publicKey,
            [],
            TOKEN_PROGRAM_ID
          )
        );
        totalRent += lamports;
      });

      // Calculate platform fee
      const platformShare = Math.floor(totalRent * PLATFORM_FEE_SHARE);
      const platformFeeTotal = PLATFORM_FEE + platformShare;

      // Add platform fee transfer
      transaction.add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: PLATFORM_ADDRESS,
          lamports: platformFeeTotal,
        })
      );

      const signature = await sendTransaction(transaction, connection, {
        skipPreflight: false,
        preflightCommitment: COMMITMENT,
        maxRetries: 3,
      });

      // Wait for confirmation with timeout
      await confirmTransaction(signature);
      
      toast.success(`Successfully closed ${accounts.length} empty accounts`);
      return {
        signature,
        rentReclaimed: totalRent - platformFeeTotal,
      };
    } catch (error) {
      console.error('Failed to close accounts:', error);
      if (error instanceof Error && error.message.includes('timeout')) {
        toast.error('Transaction timed out. Please check Solana Explorer for status.');
      } else {
        toast.error('Failed to close accounts');
      }
      throw error;
    }
  };

  return {
    handleBurnToken,
    closeEmptyTokenAccounts,
    loading,
    setLoading
  };
} 