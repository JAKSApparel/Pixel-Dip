import { Flame, Coins, Trash2, Zap } from 'lucide-react';

const features = [
  {
    icon: Flame,
    title: 'Token Burning',
    description: 'Burn any SPL token with ease and reclaim your SOL',
  },
  {
    icon: Coins,
    title: 'NFT Cleanup',
    description: 'Remove unwanted NFTs from your wallet',
  },
  {
    icon: Trash2,
    title: 'LP Position Cleanup',
    description: 'Clean up old liquidity positions',
  },
  {
    icon: Zap,
    title: 'Serum Cleanup',
    description: 'Remove old Serum market accounts',
  },
];

export function Features() {
  return (
    <section className="py-20">
      <div className="container">
        <h2 className="text-3xl font-bold text-center mb-12 bg-gradient-to-r from-purple-400 to-pink-400 text-transparent bg-clip-text">
          Features
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group p-6 rounded-lg border bg-card transition-all duration-200 hover:scale-105 hover:shadow-lg hover:bg-gradient-to-br from-purple-500/10 to-pink-500/10"
            >
              <feature.icon className="h-10 w-10 mb-4 text-purple-500 group-hover:text-pink-500 transition-colors" />
              <h3 className="font-semibold mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
} 