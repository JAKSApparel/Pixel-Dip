'use client';

import { EnhancedTokenMetadata } from '@/types';
import Image from 'next/image';
import { formatNumber } from '@/utils/format';
import { Skeleton } from '@/components/ui/skeleton';

type TokenCardProps = {
  token: EnhancedTokenMetadata;
  isSelected?: boolean;
  onSelect: (token: EnhancedTokenMetadata) => void;
};

export function TokenCard({ token, isSelected, onSelect }: TokenCardProps) {
  return (
    <button
      onClick={() => onSelect(token)}
      className={`w-full p-4 bg-[#2A2D3A] hover:bg-[#3A3D4A] rounded-lg transition-all duration-200 group ${
        isSelected ? 'ring-2 ring-purple-500' : ''
      }`}
    >
      <div className="flex items-start gap-4">
        <div className="relative w-12 h-12 rounded-full overflow-hidden bg-[#1F2937]">
          {token.image ? (
            <Image
              src={token.image}
              alt={token.name || 'Token'}
              width={48}
              height={48}
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              {token.symbol?.[0] || '?'}
            </div>
          )}
          {token.verified && (
            <div className="absolute -top-1 -right-1 bg-green-500 rounded-full p-1">
              <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
              </svg>
            </div>
          )}
        </div>
        
        <div className="flex-1 text-left">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-medium text-white group-hover:text-purple-400 transition-colors">
                {token.name || token.symbol || 'Unknown Token'}
              </h3>
              <p className="text-sm text-gray-400">{token.symbol}</p>
            </div>
            <div className="text-right">
              <p className="font-mono text-white">{token.uiAmount.toLocaleString()}</p>
              {token.price && (
                <p className="text-sm text-gray-400">
                  ${(token.price * token.uiAmount).toLocaleString()}
                </p>
              )}
            </div>
          </div>
          
          {!token.isNFT && token.marketCap && (
            <div className="grid grid-cols-3 gap-2 mt-3 text-xs text-gray-400">
              <div>
                <p>Market Cap</p>
                <p className="text-white">${formatNumber(token.marketCap)}</p>
              </div>
              <div>
                <p>Volume 24h</p>
                <p className="text-white">${formatNumber(token.volume24h || 0)}</p>
              </div>
              <div>
                <p>Holders</p>
                <p className="text-white">{formatNumber(token.holderCount || 0)}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </button>
  );
}

export function TokenCardSkeleton() {
  return (
    <div className="w-full p-4 bg-[#2A2D3A] rounded-lg">
      <div className="flex items-start gap-4">
        <Skeleton className="w-12 h-12 rounded-full" />
        <div className="flex-1">
          <div className="flex justify-between items-start">
            <div>
              <Skeleton className="h-5 w-32 mb-2" />
              <Skeleton className="h-4 w-20" />
            </div>
            <div className="text-right">
              <Skeleton className="h-5 w-24 mb-2" />
              <Skeleton className="h-4 w-16" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 