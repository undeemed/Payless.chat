"use client";

import { useEffect, useState } from "react";

interface Survey {
  id: string;
  lengthMinutes: number;
  payoutUsd: number;
  creditsReward: number;
  conversionRate: number;
  href: string;
  type: string;
  rating: number | null;
  ratingCount: number;
}

interface AdBannerProps {
  variant?: "default" | "large" | "sidebar";
  className?: string;
}

export function AdBanner({ variant = "default", className = "" }: AdBannerProps) {
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSurveys = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('payless_token');
        
        if (!token) {
          setError('Sign in to view surveys');
          setLoading(false);
          return;
        }

        const response = await fetch('/api/cpx/surveys', {
          headers: { 'Authorization': `Bearer ${token}` },
        });

        if (!response.ok) {
          setError('Surveys unavailable');
          setLoading(false);
          return;
        }

        const data = await response.json();
        // Limit surveys based on variant
        const limit = variant === 'sidebar' ? 5 : variant === 'large' ? 3 : 2;
        setSurveys(data.surveys.slice(0, limit));
      } catch {
        setError('Failed to load');
      } finally {
        setLoading(false);
      }
    };

    fetchSurveys();
  }, [variant]);

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
              ) : surveys.length === 0 ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center text-muted-foreground/50">
                    <svg className="w-8 h-8 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <span className="text-xs">No surveys available</span>
                  </div>
                </div>
              ) : (
                <div className={`p-3 space-y-2 ${variant === 'sidebar' ? 'flex flex-col' : 'flex gap-3 overflow-x-auto'}`}>
                  {surveys.map((survey) => (
                    <a
                      key={survey.id}
                      href={survey.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-shrink-0 bg-card hover:bg-card/80 rounded-lg p-3 border border-border/50 transition-colors min-w-[200px]"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <div className="text-sm font-medium">Survey</div>
                          <div className="text-xs text-muted-foreground">{survey.lengthMinutes} min</div>
                        </div>
                        <div className="text-right">
                          <div className="text-green-500 font-bold">+{survey.creditsReward}</div>
                          <div className="text-[10px] text-muted-foreground">credits</div>
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
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
    </div>
  );
}
