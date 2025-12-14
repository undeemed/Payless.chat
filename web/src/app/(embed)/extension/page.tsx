"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase";

type SortOption = 'score' | 'points' | 'conversion' | 'time';

const CPX_SCRIPT_ID = 'cpx-research-script';
const CPX_SCRIPT_URL = 'https://cdn.cpx-research.com/assets/js/script_tag_v2.0.js';

export default function ExtensionPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [secureHash, setSecureHash] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortOption, setSortOption] = useState<SortOption>('points');
  const [configKey, setConfigKey] = useState(0); // Force widget recreation on change

  useEffect(() => {
    const initUser = async () => {
      try {
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session?.user) {
          setError('Please sign in to view surveys');
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

  // Map sort option to CPX order_by value
  const getOrderBy = useCallback((sort: SortOption): number => {
    switch (sort) {
      case 'score': return 1; // best score
      case 'points': return 2; // best money/payout
      case 'conversion': return 3; // best conversion rate
      case 'time': return 1; // use score, but CPX orders by LOI internally
      default: return 2;
    }
  }, []);

  // Create CPX config object
  const createConfig = useCallback((sort: SortOption) => {
    const appId = process.env.NEXT_PUBLIC_CPX_APP_ID || '30452';
    
    return {
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
      script_config: [{
        div_id: "cpx-surveys",
        theme_style: 2,
        order_by: getOrderBy(sort),
        limit_surveys: 50
      }],
      debug: false,
      useIFrame: true,
      iFramePosition: 1,
      functions: {
        no_surveys_available: () => {
          console.log("No CPX surveys available");
        },
        count_new_surveys: (count: number) => {
          console.log("CPX surveys count:", count);
        },
        get_all_surveys: (surveys: unknown[]) => {
          console.log("CPX surveys:", surveys);
        },
        get_transaction: (transactions: unknown[]) => {
          console.log("CPX transactions:", transactions);
        }
      }
    };
  }, [userId, secureHash, getOrderBy]);

  // Load CPX script dynamically
  const loadCpxScript = useCallback(() => {
    // Remove existing script if any
    const existingScript = document.getElementById(CPX_SCRIPT_ID);
    if (existingScript) {
      existingScript.remove();
    }

    // Don't manually clear innerHTML - let React handle via key prop on container

    // Set config before loading script
    (window as unknown as Record<string, unknown>).config = createConfig(sortOption);

    // Create and add new script with cache-busting to force fresh load
    const script = document.createElement('script');
    script.id = CPX_SCRIPT_ID;
    script.src = `${CPX_SCRIPT_URL}?t=${Date.now()}`; // Cache-busting
    script.async = true;
    script.onload = () => {
      console.log('CPX script loaded with sort:', sortOption);
    };
    script.onerror = () => {
      console.error('Failed to load CPX script');
    };
    document.body.appendChild(script);
  }, [createConfig, sortOption]);

  // Load script when user data is ready or when configKey changes (sort change)
  useEffect(() => {
    if (!userId || !secureHash) return;
    
    loadCpxScript();
    
    // Cleanup on unmount
    return () => {
      const script = document.getElementById(CPX_SCRIPT_ID);
      if (script) {
        script.remove();
      }
    };
  }, [userId, secureHash, configKey, loadCpxScript]);

  // Handle sort change - update state and trigger reload via useEffect
  const handleSortChange = useCallback((newSort: SortOption) => {
    setSortOption(newSort);
    setConfigKey(prev => prev + 1); // Triggers useEffect to reload the widget
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center">
        <div className="animate-pulse text-neutral-400">Loading surveys...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-neutral-400 mb-4">{error}</div>
          <a 
            href="https://payless.chat" 
            className="text-green-500 hover:underline"
          >
            Sign in at payless.chat
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col font-sans">
      {/* Header */}
      <header className="p-3 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-white text-black flex items-center justify-center font-bold text-sm">
            P
          </div>
          <div>
            <div className="font-semibold text-sm">Payless AI</div>
            <div className="text-[10px] text-neutral-400">Earn credits with surveys</div>
          </div>
        </div>
      </header>

      {/* CPX Survey Widget Container */}
      <div className="flex-1 p-3 overflow-y-auto">
        <div className="flex items-center justify-between mb-3">
          <div className="text-xs text-neutral-400 uppercase tracking-wider">
            Available Surveys
          </div>
          
          {/* Sorting Dropdown */}
          <select
            value={sortOption}
            onChange={(e) => handleSortChange(e.target.value as SortOption)}
            className="text-xs bg-neutral-800 border border-neutral-700 text-white rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-green-500 cursor-pointer"
          >
            <option value="points">💰 Best Points</option>
            <option value="score">⭐ Best Score</option>
            <option value="conversion">📈 Best Conversion</option>
            <option value="time">⏱️ Shortest Time</option>
          </select>
        </div>
        
        {/* CPX surveys will render here */}
        <div 
          key={`cpx-container-${configKey}`}
          id="cpx-surveys" 
          style={{ minHeight: '500px', width: '100%' }}
        />
      </div>

      {/* Footer */}
      <footer className="p-3 border-t border-white/10 shrink-0">
        <div className="text-center">
          <div className="text-[10px] text-neutral-400 mb-2">
            Complete surveys to earn free AI credits
          </div>
          <a 
            href="https://payless.chat" 
            target="_blank"
            className="text-xs text-neutral-400 hover:text-white transition-colors underline"
          >
            payless.chat
          </a>
        </div>
      </footer>

      {/* CPX Research Script is loaded dynamically via useEffect */}
    </div>
  );
}
