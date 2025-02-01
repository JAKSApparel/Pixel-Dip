import { Airdrop } from '@/components/Airdrop';
import { MassTransferHero } from '@/components/MassTransferHero';

export default function AirdropPage() {
  return (
    <>
      <MassTransferHero />
      <section id="transfer" className="py-16">
        <Airdrop />
      </section>
    </>
  );
} 