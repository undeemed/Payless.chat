"use client";

import { useEffect, useState, useCallback } from "react";

declare global {
  interface Window {
    adsbygoogle: unknown[];
  }
}

interface BalanceUpdate {
  type: 'balanceUpdate';
  credits: number;
  creditsPerMinute: number;
  isEarning: boolean;
}

export default function ExtensionPage() {
  const [credits, setCredits] = useState<number | null>(null);
  const [creditsPerMinute, setCreditsPerMinute] = useState(10);
  const [isEarning, setIsEarning] = useState(false);
  const [lastEarnTime, setLastEarnTime] = useState<number | null>(null);

  // Handle messages from parent (VS Code extension)
  const handleMessage = useCallback((event: MessageEvent) => {
    const data = event.data as BalanceUpdate;
    if (data && data.type === 'balanceUpdate') {
      setCredits(data.credits);
      setCreditsPerMinute(data.creditsPerMinute);
      setIsEarning(data.isEarning);
      if (data.isEarning) {
        setLastEarnTime(Date.now());
      }
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

  useEffect(() => {
    // Initialize all ads
    try {
      const ads = document.querySelectorAll('.adsbygoogle');
      ads.forEach(() => {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      });
    } catch (e) {
      console.error('AdSense error:', e);
    }
  }, []);

  // Auto-fade earning indicator after 5 seconds of no updates
  useEffect(() => {
    if (lastEarnTime) {
      const timeout = setTimeout(() => {
        if (Date.now() - lastEarnTime > 5000) {
          setIsEarning(false);
        }
      }, 5000);
      return () => clearTimeout(timeout);
    }
  }, [lastEarnTime]);

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

  return (
    <div className="min-h-screen bg-[#1e1e1e] text-white flex flex-col">
      {/* Compact Header */}
      <header className="p-3 border-b border-white/10 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-sm">P</span>
          </div>
          <div>
            <div className="font-semibold text-sm">Payless AI</div>
            <div className="text-[10px] text-gray-400">Free AI, powered by ads</div>
          </div>
        </div>
      </header>

      {/* Credit Display */}
      <div className="p-3 flex-shrink-0">
        <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-xl p-4 shadow-lg relative overflow-hidden">
          {/* Earning animation background */}
          {isEarning && (
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
          )}
          
          <div className="relative">
            <div className="text-[10px] uppercase tracking-wider text-white/70 mb-1">Your Credits</div>
            <div className="text-3xl font-bold tabular-nums">
              {credits === null ? (
                <span className="animate-pulse">---</span>
              ) : (
                formatCredits(credits)
              )}
            </div>
            
            {/* Earning indicator */}
            <div className="text-xs text-white/70 mt-2 flex items-center gap-1">
              {isEarning ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  <span>+{creditsPerMinute}/min</span>
                </>
              ) : credits === null ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-yellow-400" />
                  <span>Sign in to earn</span>
                </>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-gray-400" />
                  <span>Keep sidebar open to earn</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Earning Rate Info */}
      <div className="px-3 pb-2 flex-shrink-0">
        <div className="bg-[#252526] rounded-lg p-3 border border-white/5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-400">Earn rate</span>
            <span className="text-green-400 font-medium">{creditsPerMinute} credits/min</span>
          </div>
          <div className="flex items-center justify-between text-xs mt-1">
            <span className="text-gray-400">Per hour</span>
            <span className="text-white/80">~{creditsPerMinute * 60} credits</span>
          </div>
        </div>
      </div>

      {/* Ad Stack - Optimized for vertical sidebar */}
      <div className="flex-1 p-3 space-y-3 overflow-y-auto">
        {/* Ad Unit 1 - Large Rectangle */}
        <div className="bg-[#252526] rounded-lg p-2 border border-white/5">
          <ins
            className="adsbygoogle"
            style={{ display: "block", minHeight: "250px" }}
            data-ad-client="ca-pub-6034027262191917"
            data-ad-slot="auto"
            data-ad-format="rectangle"
            data-full-width-responsive="true"
          />
        </div>

        {/* Ad Unit 2 - Vertical */}
        <div className="bg-[#252526] rounded-lg p-2 border border-white/5">
          <ins
            className="adsbygoogle"
            style={{ display: "block", minHeight: "300px" }}
            data-ad-client="ca-pub-6034027262191917"
            data-ad-slot="auto"
            data-ad-format="vertical"
            data-full-width-responsive="true"
          />
        </div>

        {/* Ad Unit 3 - Auto */}
        <div className="bg-[#252526] rounded-lg p-2 border border-white/5">
          <ins
            className="adsbygoogle"
            style={{ display: "block", minHeight: "250px" }}
            data-ad-client="ca-pub-6034027262191917"
            data-ad-slot="auto"
            data-ad-format="auto"
            data-full-width-responsive="true"
          />
        </div>

        {/* Ad Unit 4 - Rectangle */}
        <div className="bg-[#252526] rounded-lg p-2 border border-white/5">
          <ins
            className="adsbygoogle"
            style={{ display: "block", minHeight: "250px" }}
            data-ad-client="ca-pub-6034027262191917"
            data-ad-slot="auto"
            data-ad-format="rectangle"
            data-full-width-responsive="true"
          />
        </div>
      </div>

      {/* Footer */}
      <footer className="p-3 border-t border-white/10 flex-shrink-0">
        <div className="text-center">
          <div className="text-[10px] text-gray-500 mb-2">
            Ads help keep AI free for everyone
          </div>
          <a 
            href="https://payless.chat" 
            target="_blank"
            className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            payless.chat
          </a>
        </div>
      </footer>

      {/* Custom styles for shimmer animation */}
      <style jsx>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}</style>
    </div>
  );
}
