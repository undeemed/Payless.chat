"use client";

import { useEffect, useRef } from "react";

interface AdBannerProps {
  variant?: "default" | "large" | "sidebar";
  className?: string;
}

declare global {
  interface Window {
    adsbygoogle: unknown[];
  }
}

export function AdBanner({ variant = "default", className = "" }: AdBannerProps) {
  const adRef = useRef<HTMLModElement>(null);
  const isLoaded = useRef(false);

  useEffect(() => {
    // Only load ad once
    if (isLoaded.current) return;
    isLoaded.current = true;

    try {
      // Push ad to adsbygoogle
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (error) {
      console.error("AdSense error:", error);
    }
  }, []);

  const getAdStyle = () => {
    switch (variant) {
      case "large":
        return { display: "block", minHeight: "280px" };
      case "sidebar":
        return { display: "block", minHeight: "600px" };
      default:
        return { display: "block", minHeight: "90px" };
    }
  };

  const getAdFormat = () => {
    switch (variant) {
      case "large":
        return "rectangle"; // 336x280 or responsive
      case "sidebar":
        return "vertical"; // 160x600 or responsive
      default:
        return "horizontal"; // 728x90 or responsive
    }
  };

  return (
    <div className={`w-full bg-muted/30 border-y border-border/40 ${className}`}>
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-center">
          <div className="w-full max-w-4xl">
            {/* Ad label */}
            <div className="text-[10px] text-muted-foreground/60 uppercase tracking-wider text-center mb-2">
              Advertisement
            </div>
            
            {/* AdSense container */}
            <div className="relative bg-card/50 rounded-lg overflow-hidden border border-border/30">
              {/* 
                Replace data-ad-client and data-ad-slot with your actual AdSense values
                data-ad-client: Your publisher ID (ca-pub-XXXXXXXXXXXXXXXX)
                data-ad-slot: Your ad unit ID
              */}
              <ins
                ref={adRef}
                className="adsbygoogle"
                style={getAdStyle()}
                data-ad-client="ca-pub-6034027262191917"
                data-ad-slot="XXXXXXXXXX"
                data-ad-format={getAdFormat()}
                data-full-width-responsive="true"
              />
              
              {/* Placeholder shown before ad loads */}
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-muted/50 to-muted/30 pointer-events-none">
                <div className="text-center text-muted-foreground/50">
                  <svg className="w-8 h-8 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <rect x="3" y="3" width="18" height="18" rx="2" strokeWidth={1.5} />
                    <circle cx="8.5" cy="8.5" r="1.5" strokeWidth={1.5} />
                    <path d="M21 15l-5-5L5 21" strokeWidth={1.5} />
                  </svg>
                  <span className="text-xs">Ad Space</span>
                </div>
              </div>
            </div>

            {/* Funding note */}
            <div className="flex items-center justify-center gap-2 mt-2 text-[10px] text-muted-foreground/60">
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <path d="M9 12l2 2 4-4" />
              </svg>
              <span>Ads help keep Payless AI free for everyone</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

