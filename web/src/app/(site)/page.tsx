"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();
  
  // Supabase OAuth URL - redirects to /auth/callback which then goes to /dashboard
  const supabaseUrl = "https://bycsqbjaergjhwzbulaa.supabase.co";
  const redirectTo = "https://payless.chat/auth/callback";
  const signUpUrl = `${supabaseUrl}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(redirectTo)}`;

  // Handle tokens that might be in the URL hash (implicit flow redirect)
  useEffect(() => {
    const handleHashTokens = async () => {
      const hash = window.location.hash;
      
      if (hash && hash.includes("access_token")) {
        const supabase = createClient();
        const params = new URLSearchParams(hash.substring(1));
        const accessToken = params.get("access_token");
        const refreshToken = params.get("refresh_token");

        if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (!error) {
            // Clear the hash and redirect to dashboard
            window.history.replaceState(null, "", "/");
            router.push("/dashboard");
          }
        }
      }
    };

    handleHashTokens();
  }, [router]);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <section className="flex-1 flex flex-col justify-center items-center text-center px-4 py-24 md:py-32 border-b border-border/50">
        <div className="space-y-8 max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight text-primary">
            Free AI for VS Code.
            <br />
            <span className="text-muted-foreground font-normal">Powered by surveys.</span>
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Access GPT-5, Claude 4.5, and Gemini 3 directly in your editor. 
            No subscription required. Complete quick surveys to earn credits.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <a
              href={signUpUrl}
              className="w-full sm:w-auto px-8 py-4 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-all text-lg"
            >
              Sign Up Free
            </a>
            <a
              href="vscode:extension/payless-ai.payless-ai"
              className="w-full sm:w-auto px-8 py-4 bg-secondary text-secondary-foreground rounded-lg font-medium hover:bg-secondary/80 transition-all text-lg"
            >
              Install Extension
            </a>
          </div>
        </div>
      </section>

      {/* Models Section */}
      <section id="models" className="py-24 border-b border-border/50 bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Top-Tier Models</h2>
            <p className="text-muted-foreground">Access the most powerful AI models available today.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="bg-card p-8 rounded-xl border border-border hover:border-primary/50 transition-colors">
              <div className="text-xl font-bold mb-2">OpenAI</div>
              <div className="text-4xl font-bold mb-6 text-primary">GPT-5.1</div>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">✓ Thinking Mode</li>
                <li className="flex items-center gap-2">✓ Instant Responses</li>
                <li className="flex items-center gap-2">✓ Codex Optimized</li>
              </ul>
            </div>

            <div className="bg-card p-8 rounded-xl border border-border hover:border-primary/50 transition-colors">
              <div className="text-xl font-bold mb-2">Anthropic</div>
              <div className="text-4xl font-bold mb-6 text-primary">Claude 4.5</div>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">✓ Opus 4.5</li>
                <li className="flex items-center gap-2">✓ Sonnet 4.5</li>
                <li className="flex items-center gap-2">✓ Haiku 4.5</li>
              </ul>
            </div>

            <div className="bg-card p-8 rounded-xl border border-border hover:border-primary/50 transition-colors">
              <div className="text-xl font-bold mb-2">Google</div>
              <div className="text-4xl font-bold mb-6 text-primary">Gemini 3</div>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">✓ Pro & Flash</li>
                <li className="flex items-center gap-2">✓ Thinking Mode</li>
                <li className="flex items-center gap-2">✓ 1M+ Context</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section id="how-it-works" className="py-24 border-b border-border/50">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold mb-4">How It Works</h2>
              <p className="text-muted-foreground">Simple, transparent, and completely free.</p>
            </div>

            <div className="space-y-12">
              <div className="flex gap-6">
                <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xl shrink-0">1</div>
                <div>
                  <h3 className="text-xl font-bold mb-2">Install the Extension</h3>
                  <p className="text-muted-foreground">Add Payless AI to VS Code. A sidebar will show available surveys you can complete.</p>
                </div>
              </div>

              <div className="flex gap-6">
                <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xl shrink-0">2</div>
                <div>
                  <h3 className="text-xl font-bold mb-2">Complete Surveys</h3>
                  <p className="text-muted-foreground">Earn credits by completing quick surveys. Most take 2-15 minutes and earn 10-100+ credits each.</p>
                </div>
              </div>

              <div className="flex gap-6">
                <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xl shrink-0">3</div>
                <div>
                  <h3 className="text-xl font-bold mb-2">Code with AI</h3>
                  <p className="text-muted-foreground">Use your credits to chat with GPT-5, Claude 4.5, or Gemini 3. No credit card, no subscription.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Credits Infographic */}
      <section id="pricing" className="py-24 border-b border-border/50 bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Credit Economics</h2>
            <p className="text-muted-foreground">700 credits = $1 value • Transparent pricing for every interaction</p>
          </div>

          <div className="max-w-6xl mx-auto">
            {/* Cost Per Interaction */}
            <div className="grid md:grid-cols-3 gap-6 mb-12">
              <div className="bg-card p-6 rounded-xl border border-border hover:border-green-500/50 transition-colors group">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <h3 className="font-bold text-lg">Short Response</h3>
                </div>
                <div className="text-3xl font-bold text-green-500 mb-2">1–3 credits</div>
                <div className="text-sm text-muted-foreground">$0.001–$0.004 per interaction</div>
                <div className="text-xs text-muted-foreground mt-2">Quick answers, code snippets</div>
              </div>

              <div className="bg-card p-6 rounded-xl border border-border hover:border-yellow-500/50 transition-colors group">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <h3 className="font-bold text-lg">Medium Response</h3>
                </div>
                <div className="text-3xl font-bold text-yellow-500 mb-2">5–10 credits</div>
                <div className="text-sm text-muted-foreground">$0.007–$0.014 per interaction</div>
                <div className="text-xs text-muted-foreground mt-2">Explanations, refactoring help</div>
              </div>

              <div className="bg-card p-6 rounded-xl border border-border hover:border-orange-500/50 transition-colors group">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                  <h3 className="font-bold text-lg">Heavy Response</h3>
                </div>
                <div className="text-3xl font-bold text-orange-500 mb-2">15–30 credits</div>
                <div className="text-sm text-muted-foreground">$0.021–$0.043 per interaction</div>
                <div className="text-xs text-muted-foreground mt-2">Complex reasoning, large context</div>
              </div>
            </div>

            {/* Monthly Value & Hourly Usage */}
            <div className="grid md:grid-cols-2 gap-8 mb-12">
              {/* Monthly Equivalents */}
              <div className="bg-card p-8 rounded-xl border border-border">
                <h3 className="font-bold text-xl mb-6 flex items-center gap-2">
                  <span className="text-2xl">💰</span> Monthly Value
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-3 border-b border-border/50">
                    <div>
                      <div className="font-bold">$5 Value</div>
                      <div className="text-sm text-muted-foreground">3,500 credits</div>
                    </div>
                    <div className="text-right text-sm text-muted-foreground">
                      350–700 medium prompts
                    </div>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-border/50">
                    <div>
                      <div className="font-bold">$10 Value</div>
                      <div className="text-sm text-muted-foreground">7,000 credits</div>
                    </div>
                    <div className="text-right text-sm text-muted-foreground">
                      700–1,400 medium prompts
                    </div>
                  </div>
                  <div className="flex justify-between items-center py-3">
                    <div>
                      <div className="font-bold">$20 Value</div>
                      <div className="text-sm text-muted-foreground">14,000 credits</div>
                    </div>
                    <div className="text-right text-sm text-muted-foreground">
                      1,400–2,800 medium prompts
                    </div>
                  </div>
                </div>
              </div>

              {/* Hourly Usage */}
              <div className="bg-card p-8 rounded-xl border border-border">
                <h3 className="font-bold text-xl mb-6 flex items-center gap-2">
                  <span className="text-2xl">⚡</span> Hourly Usage (Dev Workflow)
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-3 border-b border-border/50">
                    <div>
                      <div className="font-bold text-green-500">Light Coding Help</div>
                      <div className="text-sm text-muted-foreground">50–100 credits/hr</div>
                    </div>
                    <div className="text-right font-mono text-sm">
                      $0.07–$0.14/hr
                    </div>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-border/50">
                    <div>
                      <div className="font-bold text-yellow-500">Active Refactoring</div>
                      <div className="text-sm text-muted-foreground">150–300 credits/hr</div>
                    </div>
                    <div className="text-right font-mono text-sm">
                      $0.21–$0.43/hr
                    </div>
                  </div>
                  <div className="flex justify-between items-center py-3">
                    <div>
                      <div className="font-bold text-orange-500">Heavy Reasoning</div>
                      <div className="text-sm text-muted-foreground">400–600 credits/hr</div>
                    </div>
                    <div className="text-right font-mono text-sm">
                      $0.57–$0.86/hr
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Reality Check */}
            <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-8 rounded-xl border border-primary/20">
              <h3 className="font-bold text-xl mb-4 flex items-center gap-2">
                <span className="text-2xl">📊</span> Reality Check
              </h3>
              <div className="grid md:grid-cols-2 gap-6 text-sm">
                <div className="space-y-2">
                  <div className="font-medium">A few surveys (~300 credits) ≈ $0.43</div>
                  <div className="text-muted-foreground">→ Multiple hours of light IDE help</div>
                </div>
                <div className="space-y-2">
                  <div className="font-medium">Economically efficient for intermittent use</div>
                  <div className="text-muted-foreground">→ Structurally capped for power users</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
