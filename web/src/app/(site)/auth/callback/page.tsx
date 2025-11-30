"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();

    // Handle the OAuth callback - tokens might be in URL hash
    const handleCallback = async () => {
      // Check if there's a hash with tokens (implicit flow)
      const hash = window.location.hash;
      
      if (hash && hash.includes("access_token")) {
        // Parse the hash to get tokens
        const params = new URLSearchParams(hash.substring(1));
        const accessToken = params.get("access_token");
        const refreshToken = params.get("refresh_token");

        if (accessToken && refreshToken) {
          // Set the session manually
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (!error) {
            router.push("/dashboard");
            return;
          }
          console.error("Error setting session:", error);
        }
      }

      // Check if there's a code parameter (PKCE flow)
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");
      
      if (code) {
        // The server-side route should handle this
        // But if we're here, let's try to exchange it
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        
        if (!error) {
          router.push("/dashboard");
          return;
        }
        console.error("Error exchanging code:", error);
      }

      // Check if already authenticated
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        router.push("/dashboard");
        return;
      }

      // If nothing worked, go home with error
      router.push("/?error=auth");
    };

    handleCallback();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-muted-foreground">Signing you in...</p>
      </div>
    </div>
  );
}

