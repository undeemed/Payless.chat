"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import Script from "next/script";

type SortOption = 'score' | 'points' | 'conversion' | 'time';

export default function ExtensionPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [secureHash, setSecureHash] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortOption, setSortOption] = useState<SortOption>('points');
  const [configKey, setConfigKey] = useState(0);

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
  const getOrderBy = (sort: SortOption): number => {
    switch (sort) {
      case 'score': return 1; // best score
      case 'points': return 2; // best money/payout
      case 'conversion': return 3; // best conversion rate
      case 'time': return 1; // use score, but CPX orders by LOI internally
      default: return 2;
    }
  };

  // Handle sort change - need to reinitialize the CPX widget
  const handleSortChange = (newSort: SortOption) => {
    setSortOption(newSort);
    setConfigKey(prev => prev + 1); // Force re-render of CPX widget
  };

  // Set up CPX config when we have user data
  useEffect(() => {
    if (!userId || !secureHash) return;

    const appId = process.env.NEXT_PUBLIC_CPX_APP_ID || '30452';

    // CPX script configuration
    const script1 = {
      div_id: "cpx-surveys",
      theme_style: 2, // sidebar style
      order_by: getOrderBy(sortOption),
      limit_surveys: 50 // Increased from 10 to show more surveys
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

    // Set config on window for CPX script
    (window as unknown as { config: typeof config }).config = config;
  }, [userId, secureHash, sortOption, configKey]);

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
      <header className="p-3 border-b border-white/10 flex-shrink-0">
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
          key={configKey}
          id="cpx-surveys" 
          style={{ minHeight: '500px', width: '100%' }}
        />
      </div>

      {/* Footer */}
      <footer className="p-3 border-t border-white/10 flex-shrink-0">
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

      {/* CPX Research Script */}
      {userId && secureHash && (
        <Script 
          key={`cpx-script-${configKey}`}
          src="https://cdn.cpx-research.com/assets/js/script_tag_v2.0.js"
          strategy="afterInteractive"
        />
      )}
    </div>
  );
}
