"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import Script from "next/script";

interface AdBannerProps {
  variant?: "default" | "large" | "sidebar";
  className?: string;
}

export function AdBanner({ variant = "default", className = "" }: AdBannerProps) {
  const [userId, setUserId] = useState<string | null>(null);
  const [secureHash, setSecureHash] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [configReady, setConfigReady] = useState(false);

  const divId = `cpx-banner-${variant}`;

  useEffect(() => {
    const initUser = async () => {
      try {
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session?.user) {
          setError('Sign in to view surveys');
          setLoading(false);
          return;
        }

        setUserId(session.user.id);

        // Get secure hash from API
        const response = await fetch('/api/cpx/hash', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setSecureHash(data.secure_hash);
        }

        setLoading(false);
      } catch (err) {
        console.error('Failed to initialize:', err);
        setError('Failed to load');
        setLoading(false);
      }
    };

    initUser();
  }, []);

  // Set up CPX config when we have user data
  useEffect(() => {
    if (!userId || !secureHash) return;

    const appId = process.env.NEXT_PUBLIC_CPX_APP_ID || '30452';

    // Theme style based on variant
    const themeStyle = variant === 'sidebar' ? 2 : 1;
    const limitSurveys = variant === 'sidebar' ? 5 : variant === 'large' ? 3 : 2;

    const script1 = {
      div_id: divId,
      theme_style: themeStyle,
      order_by: 2,
      limit_surveys: limitSurveys
    };

    const config = {
      general_config: {
        app_id: parseInt(appId, 10),
        ext_user_id: userId,
        email: "",
        username: "",
        secure_hash: secureHash,
        subid_1: "",
        subid_2: "",
      },
      style_config: {
        text_color: "#ffffff",
        survey_box: {
          topbar_background_color: "#22c55e",
          box_background_color: "#1a1a1a",
          rounded_borders: true,
          stars_filled: "#ffaf20",
        },
      },
      script_config: [script1],
      debug: false,
      useIFrame: true,
      iFramePosition: 1,
    };

    // Set config on window for CPX script
    (window as unknown as { config: typeof config }).config = config;
    setConfigReady(true);
  }, [userId, secureHash, variant, divId]);

  const getContainerStyle = () => {
    switch (variant) {
      case "large":
        return "min-h-[280px]";
      case "sidebar":
        return "min-h-[400px]";
      default:
        return "min-h-[120px]";
    }
  };

  return (
    <div className={`w-full bg-muted/30 border-y border-border/40 ${className}`}>
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-center">
          <div className="w-full max-w-4xl">
            {/* Survey label */}
            <div className="text-[10px] text-muted-foreground/60 uppercase tracking-wider text-center mb-2">
              Earn Credits with Surveys
            </div>
            
            {/* Survey container */}
            <div className={`relative bg-card/50 rounded-lg overflow-hidden border border-border/30 ${getContainerStyle()}`}>
              {loading ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-muted-foreground/50 text-sm">Loading surveys...</div>
                </div>
              ) : error ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-muted-foreground/50 text-sm">{error}</div>
                </div>
              ) : (
                <div id={divId} style={{ width: '100%', height: '100%' }} />
              )}
            </div>

            {/* Funding note */}
            <div className="flex items-center justify-center gap-2 mt-2 text-[10px] text-muted-foreground/60">
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <path d="M9 12l2 2 4-4" />
              </svg>
              <span>Surveys help keep Payless AI free for everyone</span>
            </div>
          </div>
        </div>
      </div>

      {/* CPX Research Script */}
      {configReady && (
        <Script 
          src="https://cdn.cpx-research.com/assets/js/script_tag_v2.0.js"
          strategy="afterInteractive"
        />
      )}
    </div>
  );
}
