export function Footer() {
  return (
    <footer className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Built with Next.js and Solana
        </p>
        <p className="text-sm text-muted-foreground">
          © {new Date().getFullYear()} Sol Crusher
        </p>
      </div>
    </footer>
  );
} 