import Link from 'next/link';

export function Footer() {
  return (
    <footer className="border-t border-border/50 py-12 bg-secondary/30">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 rounded bg-primary text-primary-foreground flex items-center justify-center font-bold text-xs">
                P
              </div>
              <span className="font-bold">Payless AI</span>
            </Link>
            <p className="text-sm text-muted-foreground">
              Free AI coding assistant for VS Code, powered by non-intrusive advertising.
            </p>
          </div>
          
          <div>
            <h3 className="font-medium mb-4">Product</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/#features" className="hover:text-foreground">Features</Link></li>
              <li><Link href="/#how-it-works" className="hover:text-foreground">How It Works</Link></li>
              <li><Link href="/#models" className="hover:text-foreground">Models</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-medium mb-4">Resources</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="https://github.com/undeemed/Payless.ai" className="hover:text-foreground">GitHub</a></li>
              <li><a href="https://github.com/undeemed/Payless.ai/issues" className="hover:text-foreground">Support</a></li>
            </ul>
          </div>

          <div>
            <h3 className="font-medium mb-4">Legal</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/privacy" className="hover:text-foreground">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-foreground">Terms of Service</Link></li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-border/50 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} Payless AI. Open source under MIT License.</p>
          <div className="flex items-center gap-4">
            <a href="https://github.com/undeemed/Payless.ai" className="hover:text-foreground">GitHub</a>
            <a href="https://twitter.com/undeemed" className="hover:text-foreground">Twitter</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
