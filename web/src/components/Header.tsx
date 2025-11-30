import Link from 'next/link';

export function Header() {
  // Supabase OAuth URL - initiates Google sign in
  const supabaseUrl = "https://bycsqbjaergjhwzbulaa.supabase.co";
  const redirectTo = "https://payless.chat";
  const signInUrl = `${supabaseUrl}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(redirectTo)}`;

  return (
    <header className="border-b border-border/40 backdrop-blur-sm sticky top-0 z-50 bg-background/80">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg group-hover:scale-105 transition-transform">
              P
            </div>
            <span className="font-bold text-lg tracking-tight">Payless AI</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
            <Link href="/#models" className="hover:text-foreground transition-colors">Models</Link>
            <Link href="/#how-it-works" className="hover:text-foreground transition-colors">How It Works</Link>
            <a
              href="https://github.com/undeemed/Payless.ai"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors"
            >
              GitHub
            </a>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <a
            href={signInUrl}
            className="text-sm font-medium px-4 py-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            Sign In
          </a>
          <a
            href={signInUrl}
            className="text-sm font-medium px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity"
          >
            Get Started
          </a>
        </div>
      </div>
    </header>
  );
}
