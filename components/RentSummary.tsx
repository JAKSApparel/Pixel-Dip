import { FC } from 'react';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';

type RentSummaryProps = {
  totalRentRecoverable: number;
  emptyAccountCount: number;
};

export const RentSummary: FC<RentSummaryProps> = ({ 
  totalRentRecoverable,
  emptyAccountCount
}) => {
  return (
    <div className="bg-[#2A2D3A] rounded-lg p-4 mb-6">
      <h3 className="text-lg font-medium text-white mb-2">Rent Recovery Summary</h3>
      <div className="space-y-2 text-sm text-gray-400">
        <p>Empty accounts: {emptyAccountCount}</p>
        <p>Recoverable SOL: {(totalRentRecoverable / LAMPORTS_PER_SOL).toFixed(4)} SOL</p>
        <p className="text-xs opacity-75">
          Note: Compressed NFTs cannot be used to recover rent
        </p>
      </div>
    </div>
  );
}; 