import { Send } from 'lucide-react';
import { MessageCircle } from 'lucide-react';

export function MassTransferHero() {
  return (
    <div className="relative overflow-hidden py-24 sm:py-32">
      {/* Background elements */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute top-0 -right-4 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-yellow-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mb-8 flex justify-center">
            <div className="relative rounded-full px-3 py-1 text-sm leading-6 text-gray-400 ring-1 ring-gray-700/10 hover:ring-gray-700/20">
              New feature.{' '}
              <a href="#" className="font-semibold text-purple-400">
                <span className="absolute inset-0" aria-hidden="true" />
                Read more <span aria-hidden="true">&rarr;</span>
              </a>
            </div>
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-gradient font-space-grotesk sm:text-6xl">
            Crush Your Transfers
          </h1>
          <p className="mt-6 text-lg leading-8 text-gray-400">
            Clean up your wallet and send tokens to multiple addresses in a single transaction. Save time and gas fees with batch transfers.
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <a
              href="#transfer"
              className="rounded-xl bg-purple-500 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-purple-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-400"
            >
              Get started
            </a>
            <a href="#learn-more" className="text-sm font-semibold leading-6 text-gray-300">
              Learn more <span aria-hidden="true">→</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
} 