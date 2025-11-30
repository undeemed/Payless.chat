import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AdBanner } from "@/components/AdBanner";

export const metadata = {
  title: "Advertising - Payless AI",
  description: "Learn how advertising powers free AI for developers with Payless AI",
};

export default function AdsPage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="py-20 hero-gradient grid-pattern">
        <div className="container mx-auto px-4 text-center">
          <Badge variant="secondary" className="mb-4">Our Model</Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Ads Power <span className="gradient-text">Free AI</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Non-intrusive advertising funds unlimited AI assistance for developers worldwide
          </p>
        </div>
      </section>

      {/* Main Ad Display Area */}
      <section className="py-12 bg-card/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-semibold mb-2">Advertisement</h2>
            <p className="text-muted-foreground">This ad helps fund your free AI credits</p>
          </div>
          
          {/* Large Rectangle Ad */}
          <AdBanner variant="large" />
        </div>
      </section>

      {/* How Ads Fund AI */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">How It Works</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              A sustainable model that benefits everyone
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <Card className="text-center">
              <CardHeader>
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </div>
                <CardTitle>You View Ads</CardTitle>
                <CardDescription>
                  Non-intrusive banner ads display in our sidebar and website
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <CardTitle>We Earn Revenue</CardTitle>
                <CardDescription>
                  Google AdSense pays us based on impressions and clicks
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <CardTitle>You Get Free AI</CardTitle>
                <CardDescription>
                  Revenue converts to credits you spend on GPT-4, Claude, Gemini
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Second Ad */}
      <AdBanner />

      {/* Ad Formats */}
      <section className="py-20 bg-card/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Ad Formats We Use</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Carefully chosen to minimize disruption while maximizing value
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <rect x="3" y="3" width="18" height="18" rx="2" strokeWidth={2} />
                  </svg>
                  Display Ads
                </CardTitle>
                <CardDescription>
                  Responsive banner ads in the VS Code sidebar and website. These adapt to available space.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-muted/50 rounded-lg p-8 text-center text-muted-foreground text-sm">
                  Example: 300×250 Rectangle
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <rect x="6" y="3" width="12" height="18" rx="2" strokeWidth={2} />
                  </svg>
                  Vertical Banners
                </CardTitle>
                <CardDescription>
                  Tall formats perfect for sidebars. Non-intrusive and always visible.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-muted/50 rounded-lg p-8 text-center text-muted-foreground text-sm">
                  Example: 160×600 Skyscraper
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Our Promise */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Our Promise to You</h2>
            </div>

            <div className="space-y-6">
              {[
                {
                  title: "No Pop-ups",
                  desc: "We never show intrusive pop-up ads that interrupt your workflow",
                  icon: "M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636",
                },
                {
                  title: "No Video Ads",
                  desc: "No auto-playing videos that slow down your coding environment",
                  icon: "M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z",
                },
                {
                  title: "No Tracking Beyond Ads",
                  desc: "We only track what's needed for ad delivery. Your code stays private.",
                  icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
                },
                {
                  title: "Always Free",
                  desc: "We'll never charge for basic AI features. Ads keep it free forever.",
                  icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
                },
              ].map((item) => (
                <div key={item.title} className="flex gap-4 items-start">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">{item.title}</h3>
                    <p className="text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Final Ad */}
      <AdBanner variant="large" />
    </div>
  );
}

