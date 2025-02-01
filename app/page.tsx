import { Incinerator } from "@/components/Incinerator";
import { Features } from "@/components/Features";
import { FAQ } from "@/components/FAQ";
import { Header } from "@/components/Header";
import { SolTransfer } from "@/components/SolTransfer";
import { Cleanup } from "@/components/Cleanup";

export default function Home() {
  return (
    <>
      <Header />
      <main className="flex flex-col min-h-screen">
        <div className="flex-1">
          <section className="relative min-h-screen px-4 overflow-hidden bg-gradient-to-b from-[#0A0B0F] to-[#141519]">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-transparent to-pink-500/10 animate-gradient" />
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.02]" />
            
            <div className="relative container mx-auto pt-32 pb-20">
              <div className="text-center mb-16">
                <h1 className="text-7xl font-bold mb-6 bg-gradient-to-r from-purple-400 to-pink-400 text-transparent bg-clip-text">
                  Sol Crusher
                </h1>
                <p className="text-2xl text-muted-foreground">
                  The Solana Token Burner for Everyone
                </p>
              </div>
              <Incinerator />
            </div>
          </section>
          <Cleanup />
          <SolTransfer />
          <Features />
          <FAQ />
        </div>
      </main>
    </>
  );
}
