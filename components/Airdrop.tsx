'use client';

import { FC, useState, useCallback } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { Transaction, PublicKey, LAMPORTS_PER_SOL, SystemProgram } from '@solana/web3.js';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { createTransferInstruction, getAssociatedTokenAddress } from '@solana/spl-token';
import { Loader2, X } from 'lucide-react';
import { toast } from 'sonner';

type AirdropRecipient = {
  address: string;
  amount: string;
  isValid: boolean;
};

export const Airdrop: FC = () => {
  const { publicKey, sendTransaction } = useWallet();
  const { connection } = useConnection();
  const [loading, setLoading] = useState(false);
  const [tokenAddress, setTokenAddress] = useState('');
  const [recipients, setRecipients] = useState<AirdropRecipient[]>([{ address: '', amount: '', isValid: false }]);
  const [isSol, setIsSol] = useState(true);

  const validateAddress = useCallback(async (address: string): Promise<boolean> => {
    try {
      new PublicKey(address);
      return true;
    } catch {
      return false;
    }
  }, []);

  const addRecipient = () => {
    setRecipients([...recipients, { address: '', amount: '', isValid: false }]);
  };

  const removeRecipient = (index: number) => {
    setRecipients(recipients.filter((_, i) => i !== index));
  };

  const updateRecipient = async (index: number, field: keyof AirdropRecipient, value: string) => {
    const newRecipients = [...recipients];
    newRecipients[index] = {
      ...newRecipients[index],
      [field]: value,
      isValid: field === 'address' ? await validateAddress(value) : newRecipients[index].isValid
    };
    setRecipients(newRecipients);
  };

  const handleAirdrop = async () => {
    if (!publicKey || recipients.some(r => !r.isValid || !r.amount)) {
      toast.error('Please provide valid addresses and amounts');
      return;
    }

    setLoading(true);
    try {
      const transaction = new Transaction();

      for (const recipient of recipients) {
        const recipientPubkey = new PublicKey(recipient.address);
        const amount = parseFloat(recipient.amount);

        if (isSol) {
          transaction.add(
            SystemProgram.transfer({
              fromPubkey: publicKey,
              toPubkey: recipientPubkey,
              lamports: Math.floor(amount * LAMPORTS_PER_SOL),
            })
          );
        } else {
          const mintPubkey = new PublicKey(tokenAddress);
          const senderATA = await getAssociatedTokenAddress(mintPubkey, publicKey);
          const recipientATA = await getAssociatedTokenAddress(mintPubkey, recipientPubkey);

          transaction.add(
            createTransferInstruction(
              senderATA,
              recipientATA,
              publicKey,
              BigInt(Math.floor(amount * Math.pow(10, 9))) // Assuming 9 decimals, adjust as needed
            )
          );
        }
      }

      const signature = await sendTransaction(transaction, connection);
      await connection.confirmTransaction(signature, 'confirmed');

      toast.success(`Successfully airdropped to ${recipients.length} recipients!`);
      setRecipients([{ address: '', amount: '', isValid: false }]);
    } catch (error) {
      console.error('Airdrop failed:', error);
      toast.error(error instanceof Error ? error.message : 'Airdrop failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto relative z-10">
      <div className="glass-card p-8 rounded-2xl">
        <div className="mb-8">
          <h2 className="text-4xl font-bold text-gradient font-space-grotesk mb-2">
            Mass Transfer
          </h2>
          <p className="text-gray-400">Send tokens or SOL to multiple addresses at once</p>
        </div>

        <div className="space-y-6">
          {!publicKey ? (
            <div className="flex justify-center mb-6">
              <WalletMultiButton className="!bg-[#2A2D3A]/80 hover:!bg-[#3A3D4A] !h-12 !rounded-xl animate-glow" />
            </div>
          ) : (
            <>
              <div className="flex gap-4">
                <button
                  onClick={() => setIsSol(true)}
                  className={`flex-1 p-4 rounded-xl transition-all ${
                    isSol 
                      ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' 
                      : 'bg-[#2A2D3A] text-gray-400 hover:bg-[#3A3D4A]'
                  }`}
                >
                  Send SOL
                </button>
                <button
                  onClick={() => setIsSol(false)}
                  className={`flex-1 p-4 rounded-xl transition-all ${
                    !isSol 
                      ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' 
                      : 'bg-[#2A2D3A] text-gray-400 hover:bg-[#3A3D4A]'
                  }`}
                >
                  Send Tokens
                </button>
              </div>

              {!isSol && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Token Address
                  </label>
                  <input
                    type="text"
                    value={tokenAddress}
                    onChange={(e) => setTokenAddress(e.target.value)}
                    className="w-full p-3 bg-[#2A2D3A] border border-gray-700 rounded-lg text-white"
                    placeholder="Enter token address"
                  />
                </div>
              )}

              <div className="space-y-4">
                {recipients.map((recipient, index) => (
                  <div key={index} className="flex gap-4">
                    <div className="flex-grow">
                      <input
                        type="text"
                        value={recipient.address}
                        onChange={(e) => updateRecipient(index, 'address', e.target.value)}
                        className="w-full p-3 bg-[#2A2D3A] border border-gray-700 rounded-lg text-white mb-2"
                        placeholder="Recipient address"
                      />
                      <input
                        type="number"
                        value={recipient.amount}
                        onChange={(e) => updateRecipient(index, 'amount', e.target.value)}
                        className="w-full p-3 bg-[#2A2D3A] border border-gray-700 rounded-lg text-white"
                        placeholder={`Amount in ${isSol ? 'SOL' : 'tokens'}`}
                        min="0"
                        step="any"
                      />
                    </div>
                    {recipients.length > 1 && (
                      <button
                        onClick={() => removeRecipient(index)}
                        className="self-center p-2 hover:bg-red-500/20 rounded-lg text-red-400"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex gap-4">
                <button
                  onClick={addRecipient}
                  className="px-4 py-2 bg-[#2A2D3A] text-gray-300 rounded-lg hover:bg-[#3A3D4A]"
                >
                  Add Recipient
                </button>
                <button
                  onClick={handleAirdrop}
                  disabled={loading || recipients.some(r => !r.isValid || !r.amount)}
                  className="flex-grow px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg
                    hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <Loader2 className="w-5 h-5 animate-spin mr-2" />
                      Processing...
                    </span>
                  ) : (
                    `Send to ${recipients.length} recipient${recipients.length > 1 ? 's' : ''}`
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}; 