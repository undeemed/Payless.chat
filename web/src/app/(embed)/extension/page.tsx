"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase";

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

interface SurveysResponse {
  surveys: Survey[];
  count: number;
  total_available: number;
  credits_per_dollar: number;
}

interface BalanceUpdate {
  type: 'balanceUpdate';
  credits: number;
  creditsPerMinute: number;
  isEarning: boolean;
}

export default function ExtensionPage() {
  const [credits, setCredits] = useState<number | null>(null);
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDark] = useState(true); // Always dark in extension

  // Handle messages from parent (VS Code extension)
  const handleMessage = useCallback((event: MessageEvent) => {
    const data = event.data as BalanceUpdate;
    if (data && data.type === 'balanceUpdate') {
      setCredits(data.credits);
    }
  }, []);

  useEffect(() => {
    // Listen for balance updates from parent
    window.addEventListener('message', handleMessage);

    // Request initial balance from parent
    if (window.parent !== window) {
      window.parent.postMessage({ type: 'requestBalance' }, '*');
    }

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [handleMessage]);

  // Fetch surveys from backend
  useEffect(() => {
    const fetchSurveys = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Get auth token from Supabase session
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session?.access_token) {
          setError('Please sign in to view surveys');
          setLoading(false);
          return;
        }

        const response = await fetch('/api/cpx/surveys', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        });

        if (!response.ok) {
          if (response.status === 503) {
            setError('Surveys not yet configured');
          } else {
            setError('Failed to load surveys');
          }
          setLoading(false);
          return;
        }

        const data: SurveysResponse = await response.json();
        setSurveys(data.surveys);
      } catch (err) {
        console.error('Failed to fetch surveys:', err);
        setError('Failed to load surveys');
      } finally {
        setLoading(false);
      }
    };

    fetchSurveys();
    
    // Refresh surveys every 5 minutes
    const interval = setInterval(fetchSurveys, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Format credits for display
  const formatCredits = (value: number) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    }
    return Math.floor(value).toLocaleString();
  };

  // Theme classes
  const bg = isDark ? 'bg-[#0a0a0a]' : 'bg-white';
  const text = isDark ? 'text-white' : 'text-black';
  const textMuted = isDark ? 'text-neutral-400' : 'text-neutral-500';
  const border = isDark ? 'border-white/10' : 'border-black/10';
  const cardBg = isDark ? 'bg-[#111]' : 'bg-neutral-50';
  const creditsBg = isDark ? 'bg-white text-black' : 'bg-black text-white';

  return (
    <div className={`min-h-screen ${bg} ${text} flex flex-col font-sans`}>
      {/* Compact Header */}
      <header className={`p-3 border-b ${border} flex-shrink-0`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-lg ${isDark ? 'bg-white' : 'bg-black'} ${isDark ? 'text-black' : 'text-white'} flex items-center justify-center font-bold text-sm`}>
              P
            </div>
            <div>
              <div className="font-semibold text-sm">Payless AI</div>
              <div className={`text-[10px] ${textMuted}`}>Earn credits with surveys</div>
            </div>
          </div>
        </div>
      </header>

      {/* Credit Display */}
      <div className="p-3 flex-shrink-0">
        <div className={`${creditsBg} rounded-xl p-4 relative overflow-hidden`}>
          <div className="relative">
            <div className={`text-[10px] uppercase tracking-wider ${isDark ? 'text-black/60' : 'text-white/60'} mb-1`}>Your Credits</div>
            <div className="text-3xl font-bold tabular-nums">
              {credits === null ? (
                <span className="opacity-50">---</span>
              ) : (
                formatCredits(credits)
              )}
            </div>
            
            <div className={`text-xs ${isDark ? 'text-black/60' : 'text-white/60'} mt-2`}>
              Complete surveys below to earn more
            </div>
          </div>
        </div>
      </div>

      {/* Survey List */}
      <div className="flex-1 p-3 space-y-3 overflow-y-auto">
        <div className={`text-xs ${textMuted} uppercase tracking-wider mb-2`}>
          Available Surveys ({surveys.length})
        </div>

        {loading ? (
          <div className={`${cardBg} rounded-lg p-6 border ${border} text-center`}>
            <div className="animate-pulse">
              <div className={`w-8 h-8 rounded-full ${isDark ? 'bg-white/10' : 'bg-black/10'} mx-auto mb-3`}></div>
              <div className={`${textMuted} text-sm`}>Loading surveys...</div>
            </div>
          </div>
        ) : error ? (
          <div className={`${cardBg} rounded-lg p-6 border ${border} text-center`}>
            <div className={`${textMuted} text-sm`}>{error}</div>
          </div>
        ) : surveys.length === 0 ? (
          <div className={`${cardBg} rounded-lg p-6 border ${border} text-center`}>
            <svg className={`w-8 h-8 mx-auto mb-3 ${textMuted}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <div className={`${textMuted} text-sm`}>No surveys available right now</div>
            <div className={`${textMuted} text-xs mt-1`}>Check back later for new opportunities</div>
          </div>
        ) : (
          surveys.map((survey) => (
            <a
              key={survey.id}
              href={survey.href}
              target="_blank"
              rel="noopener noreferrer"
              className={`${cardBg} rounded-lg p-4 border ${border} block hover:bg-white/5 transition-colors group`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm">Survey #{survey.id.slice(-6)}</span>
                    {survey.type === 'need_qualification' && (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${isDark ? 'bg-yellow-500/20 text-yellow-400' : 'bg-yellow-100 text-yellow-700'}`}>
                        Quick
                      </span>
                    )}
                  </div>
                  <div className={`text-xs ${textMuted} flex items-center gap-3`}>
                    <span className="flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {survey.lengthMinutes} min
                    </span>
                    {survey.rating && survey.ratingCount > 0 && (
                      <span className="flex items-center gap-1">
                        <svg className="w-3 h-3 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        {survey.rating.toFixed(1)}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="font-bold text-green-500 text-lg">
                    +{survey.creditsReward}
                  </div>
                  <div className={`text-[10px] ${textMuted}`}>credits</div>
                </div>
              </div>
              <div className={`mt-3 text-xs ${textMuted} flex items-center gap-1 group-hover:text-white/70 transition-colors`}>
                <span>Start survey</span>
                <svg className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </a>
          ))
        )}
      </div>

      {/* Footer */}
      <footer className={`p-3 border-t ${border} flex-shrink-0`}>
        <div className="text-center">
          <div className={`text-[10px] ${textMuted} mb-2`}>
            Complete surveys to earn free AI credits
          </div>
          <a 
            href="https://payless.chat" 
            target="_blank"
            className={`text-xs ${textMuted} hover:${text} transition-colors underline`}
          >
            payless.chat
          </a>
        </div>
      </footer>
    </div>
  );
}
