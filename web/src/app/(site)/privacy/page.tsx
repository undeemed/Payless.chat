import { Card, CardContent } from "@/components/ui/card";

export const metadata = {
  title: "Privacy Policy - Payless AI",
  description: "Privacy policy for Payless AI VS Code extension and website",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen py-20">
      <div className="container mx-auto px-4 max-w-3xl">
        <h1 className="text-4xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-muted-foreground mb-8">Last updated: {new Date().toLocaleDateString()}</p>

        <Card>
          <CardContent className="prose prose-invert max-w-none p-8">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Introduction</h2>
              <p className="text-muted-foreground leading-relaxed">
                Payless AI (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) respects your privacy and is committed to protecting your personal data. 
                This privacy policy explains how we collect, use, and safeguard your information when you use our 
                VS Code extension and website.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Information We Collect</h2>
              
              <h3 className="text-lg font-medium mt-4 mb-2">Account Information</h3>
              <p className="text-muted-foreground leading-relaxed">
                When you sign in with Google, we receive your email address, name, and profile picture from Google OAuth. 
                This information is used to create and manage your account.
              </p>

              <h3 className="text-lg font-medium mt-4 mb-2">Usage Data</h3>
              <p className="text-muted-foreground leading-relaxed">
                We collect anonymous usage statistics including:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                <li>Number of AI requests made</li>
                <li>Credit usage patterns</li>
                <li>Selected AI providers and models</li>
              </ul>

              <h3 className="text-lg font-medium mt-4 mb-2">Survey Data</h3>
              <p className="text-muted-foreground leading-relaxed">
                We use CPX Research to offer paid surveys. When you complete surveys, CPX Research collects 
                information to match you with relevant surveys and process payments. Survey participation is optional..
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">How We Use Your Information</h2>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>To provide and maintain our service</li>
                <li>To manage your account and credits</li>
                <li>To process AI requests through our backend</li>
                <li>To display relevant advertisements</li>
                <li>To improve our services</li>
                <li>To communicate with you about updates</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Data Security</h2>
              <p className="text-muted-foreground leading-relaxed">
                We implement appropriate security measures to protect your data. Your authentication tokens 
                are stored securely, and all communication with our servers is encrypted using HTTPS.
              </p>
              <p className="text-muted-foreground leading-relaxed mt-2">
                <strong>Important:</strong> We never see, store, or transmit your source code. AI requests 
                are processed in real-time and not logged.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Third-Party Services</h2>
              <p className="text-muted-foreground leading-relaxed">
                We use the following third-party services:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4 mt-2">
                <li><strong>Supabase</strong> - Authentication and database</li>
                <li><strong>CPX Research</strong> - Survey marketplace</li>
                <li><strong>OpenAI</strong> - AI services (GPT models)</li>
                <li><strong>Anthropic</strong> - AI services (Claude models)</li>
                <li><strong>Google AI</strong> - AI services (Gemini models)</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-2">
                Each of these services has their own privacy policies that govern their use of your data.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Cookies</h2>
              <p className="text-muted-foreground leading-relaxed">
                Our website uses cookies for:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4 mt-2">
                <li>Essential website functionality</li>
                <li>CPX Research survey matching</li>
                <li>Analytics (anonymous usage statistics)</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-2">
                You can control cookies through your browser settings.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Your Rights</h2>
              <p className="text-muted-foreground leading-relaxed">
                You have the right to:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4 mt-2">
                <li>Access your personal data</li>
                <li>Request deletion of your account</li>
                <li>Opt out of personalized advertising</li>
                <li>Export your data</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Children&apos;s Privacy</h2>
              <p className="text-muted-foreground leading-relaxed">
                Our service is not intended for children under 13. We do not knowingly collect personal 
                information from children under 13.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Changes to This Policy</h2>
              <p className="text-muted-foreground leading-relaxed">
                We may update this privacy policy from time to time. We will notify you of any changes 
                by posting the new policy on this page and updating the &quot;Last updated&quot; date.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">Contact Us</h2>
              <p className="text-muted-foreground leading-relaxed">
                If you have questions about this privacy policy, please contact us at:{" "}
                <a href="mailto:privacy@payless.ai" className="text-primary hover:underline">
                  privacy@payless.ai
                </a>
              </p>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

